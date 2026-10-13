#!/usr/bin/env python3
"""The data bakes moved into mot-dang/front_layer.py on 2026-09-30, so the walk
re-bakes them every night. This runs that bake into mot-dang's docs/ and copies
the map's layers here for local work."""
import os, shutil, sys
from pathlib import Path
MD = Path(os.environ.get("MOTDANG", Path.home() / "Developer/claude code projects/mot-dang"))
sys.path.insert(0, str(MD))
import front_layer
print(front_layer.bake(MD / "docs", ask="--no-interest" not in sys.argv))
out = Path(__file__).resolve().parent.parent / "out" / "data"
shutil.copytree(MD / "docs/sites/city-live/data", out, dirs_exist_ok=True)
