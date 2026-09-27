"""
config.py
Central configuration and environment variables for ArogyaPulse AI.
Automatically loads Google Gemini API credentials.
"""

import os

def load_gemini_api_key() -> str:
    # 1. Check OS Environment
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key:
        return key

    # 2. Check local .env files
    env_paths = [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", "PrompEval.AI", ".env")
    ]

    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY="):
                            val = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                return val
            except Exception:
                pass

    return ""

GEMINI_API_KEY = load_gemini_api_key()
GEMINI_MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME", "gemini-2.5-flash")
