"""
Vercel Serverless Function entry point for MuleNet AI FastAPI backend.
Enables native serverless execution of the Python ML backend on Vercel.
"""
import sys
import os

# Ensure project root and backend directories are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app

# Expose app instance for Vercel's ASGI serverless runner
__all__ = ["app"]
