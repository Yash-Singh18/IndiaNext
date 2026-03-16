from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from auth.api_key_verifier import verify_api_key
from detection.heuristic_filter import heuristic_scan, preprocess
from detection.llm_classifier import llm_classify
from detection.risk_engine import compute_final_score
from policies.decision_engine import make_decision
from logs.suspicious_log import log_entry, get_logs

router = APIRouter()


class AnalyzeRequest(BaseModel):
    api_key:  str
    prompt:   str
    context:  Optional[str] = "general"


class AnalyzeResponse(BaseModel):
    status:      str
    risk_score:  int
    action:      str
    category:    Optional[str] = None
    explanation: Optional[str] = None
    reason:      Optional[str] = None


@router.post("/api/v1/prompt-security/analyze", response_model=AnalyzeResponse)
def analyze_prompt(req: AnalyzeRequest):
    # ── Step 1: API key ──────────────────────────────────────────────────────
    if not verify_api_key(req.api_key):
        raise HTTPException(status_code=401, detail="Invalid API key")

    # ── Step 2: Heuristic fast scan ──────────────────────────────────────────
    cleaned = preprocess(req.prompt)
    heuristic = heuristic_scan(cleaned)

    # If heuristic is extremely confident, skip LLM for speed
    if heuristic["score"] >= 90:
        decision = make_decision(heuristic["score"])
        log_entry(req.prompt, heuristic["score"], heuristic["category"] or "Unknown", decision["action"])
        return AnalyzeResponse(
            status=decision["status"],
            risk_score=heuristic["score"],
            action=decision["action"],
            category=heuristic["category"],
            reason=heuristic["reason"],
        )

    # ── Step 3: LLM deep analysis ────────────────────────────────────────────
    llm = llm_classify(req.prompt, req.context)

    # ── Step 4: Weighted risk score ──────────────────────────────────────────
    final_score = compute_final_score(heuristic["score"], llm["risk_score"])

    # ── Step 5: Policy decision ──────────────────────────────────────────────
    decision = make_decision(final_score)

    # ── Step 6: Log if suspicious ────────────────────────────────────────────
    if final_score >= 30:
        log_entry(req.prompt, final_score, llm["category"], decision["action"])

    return AnalyzeResponse(
        status=decision["status"],
        risk_score=final_score,
        action=decision["action"],
        category=llm["category"],
        explanation=llm["explanation"],
        reason=decision["reason"],
    )


@router.get("/api/v1/logs")
def get_suspicious_logs():
    return {"logs": get_logs()}


@router.get("/health")
def health():
    return {"status": "ok", "service": "prompt-guard"}
