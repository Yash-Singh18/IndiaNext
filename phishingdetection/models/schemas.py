from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class Classification(str, Enum):
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    PHISHING = "phishing"


class EmailScanRequest(BaseModel):
    sender: str = ""
    subject: str = ""
    body: str = ""
    user_id: str


class URLScanRequest(BaseModel):
    url: str
    user_id: str


class MessageScanRequest(BaseModel):
    message: str
    user_id: str


class TriageOutput(BaseModel):
    classification: Classification
    confidence: float = Field(ge=0, le=1)
    reason: str


class DeepAnalysisOutput(BaseModel):
    classification: Classification
    risk_score: int = Field(ge=0, le=100)
    reasons: List[str]
    suspicious_urls: List[str]
    recommended_action: str


class URLReport(BaseModel):
    url: str
    is_malicious: bool = False
    virustotal_score: Optional[int] = None
    safe_browsing_threat: Optional[str] = None
    redirect_chain: List[str] = []
    is_homoglyph: bool = False


class DomainAnalysis(BaseModel):
    domain: str
    is_typosquatting: bool = False
    similar_to: Optional[str] = None
    similarity_score: float = 0.0
    tld_suspicious: bool = False


class ThreatBreakdown(BaseModel):
    llm_score: float = 0
    url_score: float = 0
    domain_score: float = 0
    language_score: float = 0
    final_score: float = 0


class ScanResponse(BaseModel):
    scan_id: str
    classification: Classification
    risk_score: int
    sender: str
    subject: str
    body_preview: str
    triage: TriageOutput
    deep_analysis: Optional[DeepAnalysisOutput] = None
    url_reports: List[URLReport] = []
    domain_analysis: List[DomainAnalysis] = []
    threat_breakdown: ThreatBreakdown
    reasons: List[str] = []
    recommended_action: str = ""
    created_at: str


class ScanSummary(BaseModel):
    scan_id: str
    sender: str
    subject: str
    classification: Classification
    risk_score: int
    created_at: str


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "phishing-detection"
    version: str = "1.0.0"
