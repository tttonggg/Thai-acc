# Skill: VPS Deployment

## Description
Deploy the Thai ACC application to a VPS using Docker, nginx, and systemd. Follows the existing deployment pattern from the Thai ACC project.

## Trigger
Use when:
- Ready to deploy to production/staging
- Setting up new VPS
- Updating deployment configuration
- CI/CD pipeline needs deployment step

## Assigned Model
`opencode-go/qwen-3.6` (large context for multi-file config orchestration)

## Detailed Instruction / SOP

### Step 1: Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: thaiacc
      POSTGRES_USER: thaiacc
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U thaiacc"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://thaiacc:${DB_PASSWORD}@db:5432/thaiacc
      JWT_SECRET: ${JWT_SECRET}
      ENV: production
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - backend_logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: /api
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  backend_logs:
```

### Step 2: Nginx Config
```nginx
# nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

### Step 3: Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

SERVER="root@135.181.107.76"
DEPLOY_PATH="/root/.next/standalone/thai-acc"

echo "Building images..."
docker-compose -f docker-compose.prod.yml build

echo "Pushing to server..."
docker save thaiacc-backend | ssh $SERVER "docker load"
docker save thaiacc-frontend | ssh $SERVER "docker load"

echo "Deploying..."
ssh $SERVER "
    cd $DEPLOY_PATH
    docker-compose down
    docker-compose up -d
    docker-compose ps
"

echo "Health check..."
sleep 5
curl -f http://$SERVER/health || exit 1

echo "Deployment complete!"
```

### Step 4: Environment Variables
```bash
# .env (DO NOT COMMIT)
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://redis:6379/0
```

### Step 5: Health Check Endpoint
```python
# backend/src/health.py
@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(503, "Database unavailable")
```

### Step 6: Backup Strategy
```bash
# backup.sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec thaiacc-db pg_dump -U thaiacc thaiacc > $BACKUP_DIR/thaiacc_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "thaiacc_*.sql" -mtime +7 -delete
```

### Step 7: Rollback
```bash
# rollback.sh
BACKUP_FILE=$1

ssh root@135.181.107.76 "
    docker-compose down
    docker exec -i thaiacc-db psql -U thaiacc < $BACKUP_FILE
    docker-compose up -d
"
```

## Output Format
Save to: `/deploy/` directory
