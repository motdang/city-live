#!/usr/bin/env python3
"""Assemble out/site from src/ + out/data/.  --motdang also copies it into
mot-dang assets/sites/city-live and docs/sites/city-live (the card travels with it)."""
import json, os, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MD = Path(os.environ.get("MOTDANG", Path.home() / "Developer/claude code projects/mot-dang"))
SLUG = "city-live"
SITE = ROOT / "out" / "site"

CARD = {
    "th": "เมืองตอนนี้",
    "en": "The City, Live",
    "line_th": "เชียงใหม่นาทีนี้ ร้านที่เปิดอยู่เป็นดวงไฟ ฟ้า ฝน พระจันทร์ แม่น้ำปิง อากาศ และเครื่องยนต์ค้นหาให้ดูมันคิด",
    "line_en": "Chiang Mai this minute: open places lit as lamps, with the sky, rain, moon, the Ping and the air, and an engine panel to watch the search think",
    "icon": "i-map",
    "shipped": None,
    "group": "daily",
    "where": "both",
    "served": "docs",
    "words": ["live", "now", "open now", "city", "map", "night", "lamps", "engine", "api", "developer",
              "engineer", "search engine", "open data", "เมือง", "ตอนนี้", "เปิดอยู่", "แผนที่", "กลางคืน"],
}


def build():
    if SITE.exists():
        shutil.rmtree(SITE)
    shutil.copytree(ROOT / "src", SITE)
    shutil.copytree(ROOT / "out" / "data", SITE / "data")
    if (ROOT / "out" / "home").exists():
        shutil.copytree(ROOT / "out" / "home", SITE / "home", dirs_exist_ok=True)
    card_img = ROOT / "out" / "card.jpg"
    if card_img.exists():
        shutil.copy(card_img, SITE / "card.jpg")
    return SITE


def to_motdang(shipped):
    card = dict(CARD, shipped=shipped)
    for dest in (MD / "assets/sites" / SLUG, MD / "docs/sites" / SLUG):
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(SITE, dest)
    (MD / "assets/sites" / SLUG / "card.json").write_text(json.dumps(card, ensure_ascii=False, indent=1) + "\n")
    (MD / "docs/sites" / SLUG / "card.json").unlink(missing_ok=True)
    return MD / "docs/sites" / SLUG


if __name__ == "__main__":
    print(build())
    if "--motdang" in sys.argv:
        i = sys.argv.index("--motdang")
        print(to_motdang(sys.argv[i + 1] if len(sys.argv) > i + 1 else None))
