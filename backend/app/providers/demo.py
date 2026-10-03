import re
from typing import List, Dict, Any
from app.providers.base import AIProvider

class DemoAIProvider(AIProvider):
    def get_provider_name(self) -> str:
        return "Demo Analysis (Deterministic NLP & Heuristic Rules)"

    async def is_available(self) -> bool:
        return True

    async def summarize(self, text: str, context: Dict[str, Any]) -> str:
        if not text or len(text.strip()) == 0:
            return "No extractable textual content discovered in this evidence item."

        lines = [line.strip() for line in text.split("\n") if line.strip()]
        line_count = len(lines)
        word_count = len(text.split())

        # Extract notable patterns
        emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        ips = re.findall(r'\b(?:1\d{2}|2[0-4]\d|25[0-5]|[1-9]?\d)\.(?:1\d{2}|2[0-4]\d|25[0-5]|[1-9]?\d)\.(?:1\d{2}|2[0-4]\d|25[0-5]|[1-9]?\d)\.(?:1\d{2}|2[0-4]\d|25[0-5]|[1-9]?\d)\b', text)
        currencies = re.findall(r'(?:\$|€|£|USD|EUR)\s?[0-9,]+(?:\.[0-9]{2})?', text, re.IGNORECASE)

        summary_parts = [
            f"Evidence contains {word_count} words across {line_count} record lines."
        ]

        if emails:
            summary_parts.append(f"Identified {len(set(emails))} unique electronic mail addresses.")
        if ips:
            summary_parts.append(f"Identified {len(set(ips))} network endpoint IP addresses.")
        if currencies:
            summary_parts.append(f"Discovered monetary transaction references: {', '.join(set(currencies)[:3])}.")

        # Add preview of initial content
        preview = " ".join(lines[:2])
        if len(preview) > 160:
            preview = preview[:160] + "..."
        summary_parts.append(f"Initial excerpt: \"{preview}\"")

        return " ".join(summary_parts)

    async def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        entities = []
        seen = set()

        if not text:
            return entities

        # 1. Emails -> ACCOUNT
        for email in set(re.findall(r'\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b', text)):
            if email.lower() not in seen:
                seen.add(email.lower())
                entities.append({
                    "name": email,
                    "category": "ACCOUNT",
                    "risk_score": 60 if any(k in email.lower() for k in ["proton", "tuta", "temp", "dark"]) else 30,
                    "attributes": {"type": "email_address", "domain": email.split("@")[-1]}
                })

        # 2. IP Addresses -> DEVICE
        for ip in set(re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)):
            # Filter out localhost and broadcast
            if not ip.startswith("127.") and not ip.startswith("0.") and ip not in seen:
                seen.add(ip)
                entities.append({
                    "name": ip,
                    "category": "DEVICE",
                    "risk_score": 50,
                    "attributes": {"type": "ip_address", "endpoint_type": "ipv4"}
                })

        # 3. Cryptocurrency Addresses -> ACCOUNT
        crypto_matches = set(re.findall(r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b', text))
        for crypto in crypto_matches:
            if crypto not in seen:
                seen.add(crypto)
                entities.append({
                    "name": crypto,
                    "category": "ACCOUNT",
                    "risk_score": 75,
                    "attributes": {"type": "crypto_wallet", "format": "eth_or_btc"}
                })

        # 4. Known Organization Keywords
        org_keywords = ["ShellCorp", "Meridian Logistics", "Northstar Holdings", "Vanguard Global", "Offshore Trust"]
        for org in org_keywords:
            if org.lower() in text.lower() and org.lower() not in seen:
                seen.add(org.lower())
                entities.append({
                    "name": org,
                    "category": "ORGANIZATION",
                    "risk_score": 65,
                    "attributes": {"type": "corporate_entity"}
                })

        # 5. Known Locations
        locations = ["Zurich", "Geneva", "Panama City", "Singapore", "Dubai", "Amsterdam", "London", "Nicosia"]
        for loc in locations:
            if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE) and loc.lower() not in seen:
                seen.add(loc.lower())
                entities.append({
                    "name": loc,
                    "category": "LOCATION",
                    "risk_score": 40,
                    "attributes": {"type": "geographic_location"}
                })

        # 6. Specific Suspect Names or Capitalized Person patterns
        suspects = ["Viktor Kozlov", "Elena Rostova", "Marcus Chen", "David Miller", "Dmitri Volkov"]
        for susp in suspects:
            if susp.lower() in text.lower() and susp.lower() not in seen:
                seen.add(susp.lower())
                entities.append({
                    "name": susp,
                    "category": "PERSON",
                    "risk_score": 70,
                    "attributes": {"type": "suspect_or_associate"}
                })

        return entities

    async def generate_findings(self, text: str, metadata: Dict[str, Any], filename: str) -> List[Dict[str, Any]]:
        findings = []
        lower_text = text.lower() if text else ""

        # Finding 1: Financial anomalies
        if any(term in lower_text for term in ["wire transfer", "offshore", "invoice", "unmarked", "crypto", "bitcoin", "layering"]):
            findings.append({
                "title": f"Potential Unsanctioned Financial Movement Detected in {filename}",
                "summary": "Keyword correlation indicates references to structured transactions, offshore accounts, or cryptocurrency transfers.",
                "severity": "HIGH",
                "confidence": 0.84,
                "explanation": "Heuristic match identified recurring transaction terminology commonly associated with asset diversion.",
                "analysis_mode": "DEMO_ANALYSIS"
            })

        # Finding 2: Operational security or evasion
        if any(term in lower_text for term in ["burn phone", "signal", "pgp", "encrypted", "vpn", "tor", "delete after reading"]):
            findings.append({
                "title": f"Operational Security and Concealment Indicators in {filename}",
                "summary": "Evidence references counter-surveillance techniques, secure messaging apps, or explicit instructions to purge records.",
                "severity": "HIGH",
                "confidence": 0.88,
                "explanation": "Communication patterns suggest intentional circumvention of conventional recording channels.",
                "analysis_mode": "DEMO_ANALYSIS"
            })

        # Finding 3: Metadata or Integrity Anomaly
        if metadata.get("authenticity_score", 0) > 0.65:
            findings.append({
                "title": f"Digital Asset Authenticity Discrepancy in {filename}",
                "summary": f"Heuristic inspection flagged potential image manipulation or non-standard EXIF structures (Score: {int(metadata.get('authenticity_score', 0) * 100)}%).",
                "severity": "MEDIUM",
                "confidence": 0.76,
                "explanation": metadata.get("authenticity_notes", "Compression signature and timestamp inconsistencies detected."),
                "analysis_mode": "DEMO_ANALYSIS"
            })

        # Default fallback finding if none matched
        if not findings:
            findings.append({
                "title": f"Evidence Ingestion and Baseline Assessment for {filename}",
                "summary": "Preliminary automated processing completed without immediate high-threat keyword triggers.",
                "severity": "LOW",
                "confidence": 0.90,
                "explanation": "Standard ingestion protocol completed. No critical anomalies identified in the initial deterministic rule pass.",
                "analysis_mode": "DEMO_ANALYSIS"
            })

        return findings
