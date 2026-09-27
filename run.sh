#!/usr/bin/env bash
echo "Starting ArogyaPulse AI..."
if [ -f ".venv/bin/python" ]; then
    .venv/bin/python backend/app.py
else
    python3 backend/app.py
fi
