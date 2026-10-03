import hashlib
import json
import os
from typing import Dict, Any, Tuple, Optional
from PIL import Image, ExifTags

class MetadataService:
    @staticmethod
    def calculate_sha256(file_path: str) -> str:
        """Calculate standard SHA-256 cryptographic hash of a file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def _convert_gps_coords(coord_tuples, ref) -> Optional[float]:
        try:
            degrees = float(coord_tuples[0])
            minutes = float(coord_tuples[1])
            seconds = float(coord_tuples[2])
            decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
            if ref in ["S", "W"]:
                decimal = -decimal
            return round(decimal, 6)
        except Exception:
            return None

    @classmethod
    def extract_image_metadata(cls, file_path: str) -> Dict[str, Any]:
        result = {
            "format": None,
            "width": None,
            "height": None,
            "created_date": None,
            "device_make": None,
            "device_model": None,
            "gps_latitude": None,
            "gps_longitude": None,
            "raw": {}
        }

        try:
            with Image.open(file_path) as img:
                result["format"] = img.format
                result["width"] = img.width
                result["height"] = img.height

                exif = img.getexif()
                if exif:
                    # Map standard EXIF tags
                    tag_map = {ExifTags.TAGS[k]: v for k, v in exif.items() if k in ExifTags.TAGS}
                    result["raw"] = {str(k): str(v) for k, v in tag_map.items()}

                    result["device_make"] = tag_map.get("Make")
                    result["device_model"] = tag_map.get("Model")
                    result["created_date"] = tag_map.get("DateTime") or tag_map.get("DateTimeOriginal")

                    # Check for GPS Info
                    gps_info = exif.get_ifd(ExifTags.IFD.GPSInfo) if hasattr(ExifTags, "IFD") else None
                    if gps_info:
                        gps_tags = {ExifTags.GPSTAGS.get(t, t): val for t, val in gps_info.items()}
                        if "GPSLatitude" in gps_tags and "GPSLatitudeRef" in gps_tags:
                            result["gps_latitude"] = cls._convert_gps_coords(gps_tags["GPSLatitude"], gps_tags["GPSLatitudeRef"])
                        if "GPSLongitude" in gps_tags and "GPSLongitudeRef" in gps_tags:
                            result["gps_longitude"] = cls._convert_gps_coords(gps_tags["GPSLongitude"], gps_tags["GPSLongitudeRef"])
        except Exception as e:
            result["error"] = str(e)

        return result

    @classmethod
    def extract_document_metadata(cls, file_path: str, mime_type: str) -> Dict[str, Any]:
        result = {
            "format": mime_type.split("/")[-1].upper(),
            "width": None,
            "height": None,
            "created_date": None,
            "author": None,
            "page_count": 1,
            "raw": {}
        }

        stat = os.stat(file_path)
        from datetime import datetime
        result["created_date"] = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

        if "pdf" in mime_type.lower():
            try:
                # Basic PDF header parser if fitz/pymupdf is not loaded
                with open(file_path, "rb") as f:
                    content = f.read(4096)
                    if b"/Author" in content:
                        try:
                            author_part = content.split(b"/Author")[1].split(b")")[0].replace(b"(", b"").strip()
                            result["author"] = author_part.decode("utf-8", errors="ignore")
                        except Exception:
                            pass
            except Exception:
                pass

        return result
