# Thai ACC Backend

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://thaiacc:password@localhost:5432/thaiacc

# Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
ENV=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up database (make sure PostgreSQL is running)
alembic upgrade head

# 4. Run development server
uvicorn src.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
