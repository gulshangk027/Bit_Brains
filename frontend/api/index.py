"""
Vercel Serverless Function entry point for MuleNet AI FastAPI backend (inside frontend root).
Ensures compatibility when Vercel project Root Directory is configured as 'frontend'.
"""
import sys
import os

# Resolve paths to backend and project root
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(FRONTEND_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for candidate in [PROJECT_ROOT, BACKEND_DIR, os.path.join(FRONTEND_DIR, "backend")]:
    if os.path.exists(candidate) and candidate not in sys.path:
        sys.path.insert(0, candidate)

from app.main import app

__all__ = ["app"]
