import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models.schemas import (
    EmailScanRequest, URLScanRequest, MessageScanRequest,
    ScanResponse, Classification, DomainAnalysis, ThreatBreakdown,
)
from services.email_parser import EmailParser
from services.feature_extractor import FeatureExtractor
from services.llm_triage import LLMTriage
from services.llm_deep_analysis import LLMDeepAnalysis
from services.url_scanner import URLScanner
from services.threat_scorer import ThreatScorer
from services.db_service import DBService

router = APIRouter()

triage = LLMTriage()
deep_analyzer = LLMDeepAnalysis()
url_scanner = URLScanner()
db_service = DBService()


async def run_pipeline(parsed_email: dict, user_id: str) -> ScanResponse:
    scan_id = str(uuid.uuid4())

    # Feature extraction
    sender_domain_analysis = FeatureExtractor.analyze_domain(parsed_email.get("sender_domain", ""))
    url_domain_analyses = FeatureExtractor.analyze_urls(parsed_email.get("urls", []))
    language_info = FeatureExtractor.analyze_language(
        parsed_email.get("body", "") + " " + parsed_email.get("subject", "")
    )

    # LLM Triage (fast, Llama 8B)
    triage_result = triage.classify(parsed_email)

    # URL scanning (async)
    url_reports = await url_scanner.scan_urls(parsed_email.get("urls", []))

    # Deep analysis only for non-SAFE (saves compute)
    deep_result = None
    if triage_result.classification != Classification.SAFE:
        all_domain_info = {"sender": sender_domain_analysis, "urls": url_domain_analyses}
        deep_result = deep_analyzer.analyze(parsed_email, all_domain_info, language_info)

    # Build DomainAnalysis list
    domain_analysis_list = []
    if sender_domain_analysis.get("similar_to") or sender_domain_analysis.get("tld_suspicious"):
        domain_analysis_list.append(DomainAnalysis(
            domain=parsed_email.get("sender_domain", ""),
            is_typosquatting=sender_domain_analysis.get("is_typosquatting", False),
            similar_to=sender_domain_analysis.get("similar_to"),
            similarity_score=sender_domain_analysis.get("similarity_score", 0),
            tld_suspicious=sender_domain_analysis.get("tld_suspicious", False),
        ))
    for ud in url_domain_analyses:
        if ud.get("similar_to") or ud.get("tld_suspicious"):
            domain_analysis_list.append(DomainAnalysis(
                domain=ud.get("domain", ""),
                is_typosquatting=ud.get("is_typosquatting", False),
                similar_to=ud.get("similar_to"),
                similarity_score=ud.get("similarity_score", 0),
                tld_suspicious=ud.get("tld_suspicious", False),
            ))

    # Threat scoring (weighted combination)
    threat = ThreatScorer.compute(
        triage=triage_result,
        deep_analysis=deep_result,
        url_reports=url_reports,
        domain_analyses=[sender_domain_analysis] + url_domain_analyses,
        language_info=language_info,
    )

    final_classification = ThreatScorer.classify_score(threat.final_score)
    if deep_result:
        final_classification = deep_result.classification

    risk_score = int(threat.final_score)
    if deep_result:
        risk_score = deep_result.risk_score

    # Clamp genuinely safe emails to 0 so users don't panic over noise
    if final_classification == Classification.SAFE and risk_score < 15:
        risk_score = 0

    reasons = []
    if deep_result:
        reasons = deep_result.reasons
    else:
        reasons = [triage_result.reason]

    recommended_action = ""
    if deep_result:
        recommended_action = deep_result.recommended_action
    elif final_classification == Classification.SAFE:
        recommended_action = "No action needed - email appears safe"
    elif final_classification == Classification.SUSPICIOUS:
        recommended_action = "Review email carefully before interacting"
    else:
        recommended_action = "Do not click any links or provide information"

    result = ScanResponse(
        scan_id=scan_id,
        classification=final_classification,
        risk_score=risk_score,
        sender=parsed_email.get("sender", ""),
        subject=parsed_email.get("subject", ""),
        body_preview=parsed_email.get("body", "")[:300],
        triage=triage_result,
        deep_analysis=deep_result,
        url_reports=url_reports,
        domain_analysis=domain_analysis_list,
        threat_breakdown=threat,
        reasons=reasons,
        recommended_action=recommended_action,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    try:
        db_service.save_scan(result, user_id)
    except Exception:
        pass

    return result


@router.post("/api/scan/email", response_model=ScanResponse)
async def scan_email(request: EmailScanRequest):
    if not request.body and not request.subject:
        raise HTTPException(status_code=400, detail="Email body or subject is required")

    parsed = EmailParser.parse_raw(request.sender, request.subject, request.body)
    return await run_pipeline(parsed, request.user_id)


@router.post("/api/scan/eml", response_model=ScanResponse)
async def scan_eml(file: UploadFile = File(...), user_id: str = Form(...)):
    if not file.filename or not file.filename.lower().endswith(".eml"):
        raise HTTPException(status_code=400, detail="Only .eml files are accepted")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    parsed = EmailParser.parse_eml(content)
    return await run_pipeline(parsed, user_id)


@router.post("/api/scan/url", response_model=ScanResponse)
async def scan_url(request: URLScanRequest):
    """Scan a single URL for phishing indicators."""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    parsed = {
        "sender": "",
        "subject": f"URL check: {url}",
        "body": url,
        "urls": [url],
        "sender_domain": "",
        "headers": {},
    }
    return await run_pipeline(parsed, request.user_id)


@router.post("/api/scan/message", response_model=ScanResponse)
async def scan_message(request: MessageScanRequest):
    """Scan a text message (SMS, WhatsApp, etc.) for phishing indicators."""
    msg = request.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message text is required")

    parsed = EmailParser.parse_raw("", "Message scan", msg)
    return await run_pipeline(parsed, request.user_id)
