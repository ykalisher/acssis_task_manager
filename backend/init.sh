#!/bin/bash
set -e
python3 backend/init_db.py
exec "$@"
