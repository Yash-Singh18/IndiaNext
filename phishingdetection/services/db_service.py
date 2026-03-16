import uuid
from typing import List, Optional, Dict
from supabase import create_client
from config.settings import settings
from models.schemas import ScanResponse


class DBService:
    def __init__(self):
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        else:
            self.client = None

    def save_scan(self, result: ScanResponse, user_id: str) -> str:
        if not self.client:
            return result.scan_id

        scan_id = result.scan_id

        self.client.table("email_scans").insert({
            "id": scan_id,
            "user_id": user_id,
            "sender": result.sender,
            "subject": result.subject,
            "body_preview": result.body_preview[:500],
            "classification": result.classification.value,
            "risk_score": result.risk_score,
            "created_at": result.created_at,
        }).execute()

        self.client.table("scan_results").insert({
            "id": str(uuid.uuid4()),
            "scan_id": scan_id,
            "triage_output": result.triage.model_dump(),
            "deep_analysis": result.deep_analysis.model_dump() if result.deep_analysis else None,
            "url_reports": [r.model_dump() for r in result.url_reports],
            "domain_analysis": [d.model_dump() for d in result.domain_analysis],
            "threat_breakdown": result.threat_breakdown.model_dump(),
            "reasons": result.reasons,
            "recommended_action": result.recommended_action,
        }).execute()

        return scan_id

    def get_scan(self, scan_id: str) -> Optional[Dict]:
        if not self.client:
            return None

        scan = self.client.table("email_scans").select("*").eq("id", scan_id).single().execute()
        if not scan.data:
            return None

        details = self.client.table("scan_results").select("*").eq("scan_id", scan_id).single().execute()

        return {
            **scan.data,
            "details": details.data if details.data else {},
        }

    def get_user_scans(self, user_id: str) -> List[Dict]:
        if not self.client:
            return []

        result = self.client.table("email_scans").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).limit(50).execute()

        return result.data or []
