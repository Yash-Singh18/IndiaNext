import httpx
import re
import asyncio
import base64
from typing import List, Optional
from config.settings import settings
from models.schemas import URLReport

HOMOGLYPHS = {
    'a': ['\u0430', '\u0105', '\u00e5', '\u03b1'],
    'e': ['\u0435', '\u0451', '\u03b5'],
    'o': ['\u043e', '\u00f6', '\u03bf', '0'],
    'i': ['\u0456', '\u03b9', '1', 'l'],
    'l': ['\u0142', '1', '\u0456', 'I'],
    'c': ['\u0441', '\u00e7'],
    'p': ['\u0440', '\u03c1'],
    's': ['\u0455'],
    'n': ['\u00f1', '\u03b7'],
}


class URLScanner:
    def __init__(self):
        self.vt_key = settings.VIRUSTOTAL_API_KEY
        self.gsb_key = settings.GOOGLE_SAFE_BROWSING_KEY

    async def scan_urls(self, urls: List[str]) -> List[URLReport]:
        if not urls:
            return []
        urls = urls[:10]
        tasks = [self._scan_single(url) for url in urls]
        return await asyncio.gather(*tasks)

    async def _scan_single(self, url: str) -> URLReport:
        report = URLReport(url=url)

        domain = self._extract_domain(url)
        report.is_homoglyph = self._check_homoglyph(domain)

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            report.redirect_chain = await self._resolve_redirects(client, url)

            if self.vt_key:
                vt_result = await self._check_virustotal(client, url)
                if vt_result is not None:
                    report.virustotal_score = vt_result
                    if vt_result > 2:
                        report.is_malicious = True

            if self.gsb_key:
                gsb_result = await self._check_safe_browsing(client, url)
                if gsb_result:
                    report.safe_browsing_threat = gsb_result
                    report.is_malicious = True

        return report

    async def _resolve_redirects(self, client: httpx.AsyncClient, url: str) -> List[str]:
        chain = []
        current = url
        for _ in range(5):
            try:
                resp = await client.head(current, follow_redirects=False)
                if resp.status_code in (301, 302, 303, 307, 308):
                    location = resp.headers.get("location", "")
                    if location:
                        chain.append(location)
                        current = location
                    else:
                        break
                else:
                    break
            except Exception:
                break
        return chain

    async def _check_virustotal(self, client: httpx.AsyncClient, url: str) -> Optional[int]:
        try:
            url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": self.vt_key},
            )
            if resp.status_code == 200:
                data = resp.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                return stats.get("malicious", 0)
        except Exception:
            pass
        return None

    async def _check_safe_browsing(self, client: httpx.AsyncClient, url: str) -> Optional[str]:
        try:
            resp = await client.post(
                f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={self.gsb_key}",
                json={
                    "client": {"clientId": "northstar", "clientVersion": "1.0.0"},
                    "threatInfo": {
                        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [{"url": url}],
                    },
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                if matches:
                    return matches[0].get("threatType", "UNKNOWN")
        except Exception:
            pass
        return None

    def _check_homoglyph(self, domain: str) -> bool:
        for char in domain:
            for alternatives in HOMOGLYPHS.values():
                if char in alternatives:
                    return True
        return False

    def _extract_domain(self, url: str) -> str:
        match = re.search(r'https?://([^/\s:?#]+)', url)
        return match.group(1).lower() if match else ""
