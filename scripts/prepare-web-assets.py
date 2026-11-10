"""Prepare smaller existing ClassJourney web assets, without altering originals.

Run: python prepare_assets.py --source path/to/ClassJourney.html
Requires Pillow with WebP support. No private collection is read.
"""

import argparse
import base64
import hashlib
import io
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw


KEEP_BACKGROUNDS = ("journey", "resources", "care")


def decode(data_url):
    payload = base64.b64decode(data_url.split(",", 1)[1], validate=True)
    return payload, Image.open(io.BytesIO(payload))


def data_url(payload):
    return "data:image/webp;base64," + base64.b64encode(payload).decode("ascii")


def prepare(source, output):
    html = source.read_text(encoding="utf-8")
    match = re.search(r'<script\b[^>]*\bid="embedded-data"[^>]*>([\s\S]*?)</script>', html)
    if not match:
        raise ValueError("Missing embedded starter collection")
    original = json.loads(match[1])
    if len(original["plans"]) != 1 or original["plans"][0].get("id") != "demo-tag" or not original["plans"][0].get("isDemo"):
        raise ValueError("Only the public, demo-only starter collection may be optimized")
    if original["plans"][0]["backgroundId"] not in KEEP_BACKGROUNDS:
        raise ValueError("The demo background must be retained")
    data = json.loads(json.dumps(original))
    output.mkdir(parents=True, exist_ok=True)
    image_directory = output / "images"
    image_directory.mkdir(exist_ok=True)
    records, previews = [], []

    for key, item in list(data["assets"]["backgrounds"].items()):
        before, image = decode(item["src"])
        before_size = image.size
        if key not in KEEP_BACKGROUNDS:
            records.append({"id": key, "name": item["name"], "action": "removed-from-starter", "beforeBytes": len(before), "afterBytes": 0, "beforeDimensions": before_size})
            del data["assets"]["backgrounds"][key]
            continue
        optimized = image.convert("RGB")
        optimized.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        encoded = io.BytesIO()
        optimized.save(encoded, format="WEBP", quality=82, method=6)
        payload = encoded.getvalue()
        (image_directory / f"{key}.webp").write_bytes(payload)
        item["src"] = data_url(payload)
        records.append({"id": key, "name": item["name"], "action": "kept", "beforeBytes": len(before), "afterBytes": len(payload), "beforeDimensions": before_size, "afterDimensions": optimized.size})
        previews.append((key, image.copy(), Image.open(io.BytesIO(payload)).copy()))

    # Preserve both complete 3 x 2 icon atlases at their original pixel size.
    # Lossless WebP keeps every RGBA pixel, including transparent borders.
    for key in ("atlas", "fageAtlas"):
        before, image = decode(data["assets"][key])
        rgba = image.convert("RGBA")
        encoded = io.BytesIO()
        rgba.save(encoded, format="WEBP", lossless=True, exact=True, method=6)
        payload = encoded.getvalue()
        decoded = Image.open(io.BytesIO(payload)).convert("RGBA")
        if rgba.size != decoded.size or rgba.tobytes() != decoded.tobytes():
            raise ValueError(f"Lossless atlas verification failed: {key}")
        if rgba.width % 3 or rgba.height % 2:
            raise ValueError("Unexpected icon grid")
        (image_directory / f"{key}.webp").write_bytes(payload)
        data["assets"][key] = data_url(payload)
        records.append({"id": key, "action": "lossless-reencoded", "beforeBytes": len(before), "afterBytes": len(payload), "beforeDimensions": image.size, "afterDimensions": decoded.size, "rgbaPixelsIdentical": True, "grid": [3, 2], "icons": 6})
        previews.append((key, rgba.copy(), decoded.copy()))

    serialized = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (output / "starter-collection.json").write_text(serialized, encoding="utf-8")
    old_bytes = len(json.dumps(original, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    new_bytes = len(serialized.encode("utf-8"))
    report = {
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "backgroundsBefore": len(original["assets"]["backgrounds"]),
        "backgroundsAfter": len(data["assets"]["backgrounds"]),
        "keptBackgrounds": list(KEEP_BACKGROUNDS),
        "removedBackgrounds": [r["id"] for r in records if r["action"] == "removed-from-starter"],
        "demoPlans": len(data["plans"]),
        "iconsPreserved": 12,
        "originalCollectionBytes": old_bytes,
        "optimizedCollectionBytes": new_bytes,
        "collectionReductionPercent": round(100 * (1 - new_bytes / old_bytes), 2),
        "originalImageBytes": sum(r["beforeBytes"] for r in records),
        "optimizedImageBytes": sum(r["afterBytes"] for r in records),
        "assets": records,
    }
    (output / "optimization-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    # Review sheet: backgrounds before/after, and all twelve retained symbols.
    sheet = Image.new("RGB", (1440, 60 + 405 * len(previews)), "#edf1f5")
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 16), "ClassJourney: original (left) / optimized (right)", fill="#182638")
    top = 50
    for key, old, new in previews:
        draw.text((24, top), key + (" - exact RGBA preserved" if "atlas" in key.lower() else " - max. 1600 px / WebP quality 82"), fill="#182638")
        top += 25
        for n, img in enumerate((old, new)):
            thumb = img.copy()
            thumb.thumbnail((680, 350), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", thumb.size, "white")
            canvas.alpha_composite(thumb.convert("RGBA"))
            sheet.paste(canvas.convert("RGB"), (24 + 712 * n, top))
        top += 380
    sheet.crop((0, 0, 1440, top + 10)).save(output / "asset-comparison.jpg", quality=92)
    print(json.dumps({k: v for k, v in report.items() if k != "assets"}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent)
    options = parser.parse_args()
    prepare(options.source.resolve(strict=True), options.output.resolve())
