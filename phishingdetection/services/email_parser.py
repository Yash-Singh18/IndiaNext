import re
import email
from email import policy
from typing import Dict, List
from bs4 import BeautifulSoup


class EmailParser:
    @staticmethod
    def parse_raw(sender: str, subject: str, body: str) -> Dict:
        soup = BeautifulSoup(body, "lxml")
        for tag in soup(["script", "style"]):
            tag.decompose()
        clean_text = soup.get_text(separator=" ", strip=True)

        urls = EmailParser._extract_urls(body) + EmailParser._extract_href_urls(soup)
        urls = list(set(urls))
        sender_domain = EmailParser._extract_domain(sender)

        return {
            "sender": sender,
            "subject": subject,
            "body": clean_text,
            "urls": urls,
            "sender_domain": sender_domain,
            "headers": {},
        }

    @staticmethod
    def _safe_get_content(part) -> str:
        try:
            content = part.get_content()
            if isinstance(content, bytes):
                return content.decode("utf-8", errors="replace")
            return str(content) if content else ""
        except (KeyError, LookupError, UnicodeDecodeError):
            try:
                payload = part.get_payload(decode=True)
                if payload:
                    return payload.decode("utf-8", errors="replace")
            except Exception:
                pass
            return ""

    @staticmethod
    def parse_eml(eml_bytes: bytes) -> Dict:
        msg = email.message_from_bytes(eml_bytes, policy=policy.default)

        sender = str(msg.get("From", ""))
        subject = str(msg.get("Subject", ""))

        headers = {
            "spf": str(msg.get("Received-SPF", "")),
            "dkim": str(msg.get("DKIM-Signature", "")),
            "return_path": str(msg.get("Return-Path", "")),
            "received": [str(h) for h in msg.get_all("Received", [])],
        }

        body = ""
        html_body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if part.get_content_maintype() == "multipart":
                    continue
                if ctype == "text/plain" and not body:
                    body = EmailParser._safe_get_content(part)
                elif ctype == "text/html" and not html_body:
                    html_body = EmailParser._safe_get_content(part)
        else:
            ctype = msg.get_content_type()
            if ctype == "text/html":
                html_body = EmailParser._safe_get_content(msg)
            else:
                body = EmailParser._safe_get_content(msg)

        if html_body:
            soup = BeautifulSoup(html_body, "lxml")
            for tag in soup(["script", "style"]):
                tag.decompose()
            clean_text = soup.get_text(separator=" ", strip=True)
            urls = EmailParser._extract_urls(html_body) + EmailParser._extract_href_urls(soup)
        else:
            clean_text = body if isinstance(body, str) else str(body)
            urls = EmailParser._extract_urls(clean_text)

        urls = list(set(urls))
        sender_domain = EmailParser._extract_domain(sender)

        return {
            "sender": sender,
            "subject": subject,
            "body": clean_text,
            "urls": urls,
            "sender_domain": sender_domain,
            "headers": headers,
        }

    @staticmethod
    def _extract_urls(text: str) -> List[str]:
        url_pattern = re.compile(r'https?://[^\s<>"\')\]]+', re.IGNORECASE)
        return url_pattern.findall(text)

    @staticmethod
    def _extract_href_urls(soup: BeautifulSoup) -> List[str]:
        urls = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith(("http://", "https://")):
                urls.append(href)
        return urls

    @staticmethod
    def _extract_domain(email_addr: str) -> str:
        match = re.search(r'@([\w.-]+)', email_addr)
        return match.group(1).lower() if match else ""
