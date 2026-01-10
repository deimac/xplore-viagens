#!/bin/bash
# start.sh - inicializa Node e Caddy no container

# Exporta variáveis de ambiente
export PORT=3000
export NIXPACKS_SPA_OUTPUT_DIR=dist/public

# Inicia Caddy em background
caddy run --config /assets/Caddyfile --adapter caddyfile &

# Inicia o servidor Node
node dist/index.js
