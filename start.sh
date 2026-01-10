#!/bin/bash
set -e

echo "🚀 Starting Xplore Viagens backend"

export NODE_ENV=production
export PORT=3000

exec node dist/index.js
