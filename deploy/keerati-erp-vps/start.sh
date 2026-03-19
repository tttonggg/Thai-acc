#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=3000
export $(grep -v '^#' .env.production | xargs)
node server.js
