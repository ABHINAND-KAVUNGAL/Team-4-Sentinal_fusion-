import shutil
import subprocess
from typing import Tuple

class OCRService:
    @staticmethod
    def is_tesseract_available() -> bool:
        return shutil.which("tesseract") is not None

    @classmethod
    def extract_text_from_file(cls, file_path: str, mime_type: str) -> Tuple[str, bool]:
        """
        Extract text from file.
        Returns (extracted_text, ocr_was_used)
        """
        mime_type = mime_type.lower()

        # 1. Plaintext or structured text formats
        if any(t in mime_type for t in ["text/", "json", "csv", "xml", "html", "javascript", "log"]):
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    return f.read(), False
            except Exception as e:
                return f"[Failed to read text file: {e}]", False

        # 2. PDF documents
        if "pdf" in mime_type:
            # Try reading embedded text strings directly
            try:
                text_chunks = []
                with open(file_path, "rb") as f:
                    data = f.read()
                    # Look for stream / text objects
                    for raw_str in data.split(b"stream"):
                        if b"endstream" in raw_str:
                            chunk = raw_str.split(b"endstream")[0]
                            # Extract printable ascii / utf8
                            clean = "".join(chr(b) for b in chunk if 32 <= b <= 126 or b in [10, 13])
                            if len(clean) > 20 and not clean.startswith("x\x9c"):
                                text_chunks.append(clean)
                if text_chunks:
                    return "\n\n".join(text_chunks)[:8000], False
                return "[PDF document ingested. No uncompressed plaintext streams identified.]", False
            except Exception as e:
                return f"[PDF parsing error: {e}]", False

        # 3. Images (OCR pass)
        if "image/" in mime_type:
            if cls.is_tesseract_available():
                try:
                    # Run tesseract
                    cmd = ["tesseract", file_path, "stdout", "--oem", "1", "-l", "eng"]
                    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
                    if proc.returncode == 0 and proc.stdout.strip():
                        return proc.stdout.strip(), True
                    return "[Tesseract OCR completed with no textual output detected.]", True
                except Exception as e:
                    return f"[OCR execution error: {e}]", False
            else:
                return "[OCR engine unavailable in this environment (Tesseract binary not installed). Optical text extraction skipped.]", False

        return "[Unsupported binary file format for text extraction.]", False
