# SERVER
PORT=3000
NODE_ENV=production

# DATABASE
DATABASE_URL=mysql://xplore:3PIbucxhrETl8pLJdovu3aajBKYEekhEEZWAThXHsghOonLXCbdTIGUo31vG9Y5x@31.97.249.115:3306/xplore_db

# JWT
JWT_SECRET=pu/BUYxofqIb+j8LPAeniii9/571VAlqvY2r0BKJbvQ=
JWT_EXPIRES_IN=7d

# GOOGLE OAUTH (dummy por enquanto)
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/callback
OAUTH_SERVER_URL=http://localhost:4000

# FRONTEND
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# SPA / Caddy
NIXPACKS_SPA_OUTPUT_DIR=dist/public

# FILE STORAGE
STORAGE_TYPE=local
UPLOADS_DIR=uploads

# AWS (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET=

# SMTP (opcional)
SMTP_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@xploreviagens.com.br
OWNER_EMAIL=

# APP
APP_NAME=Xplore Viagens
APP_URL=http://localhost:3000

# VITE (para o build do frontend)
VITE_APP_LOGO=logo.png
VITE_APP_TITLE=Xplore Viagens
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
