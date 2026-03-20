#!/bin/bash
# ============================================
# DevOps Setup Script
# Sets up local development environment
# ============================================

set -e

echo "🚀 Setting up Thai ERP DevOps environment..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "⚠️  kubectl not found. Install it for Kubernetes support." >&2; }
command -v helm >/dev/null 2>&1 || { echo "⚠️  Helm not found. Install it for Kubernetes support." >&2; }

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p monitoring/grafana/dashboards

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Setup husky
echo "🐕 Setting up git hooks..."
npx husky install || true

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/security/*.sh
chmod +x scripts/*.sh 2>/dev/null || true

# Setup Docker Compose
echo "🐳 Setting up Docker Compose..."
docker-compose pull

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your configuration"
echo "  2. Run 'npm run docker:compose:up' to start services"
echo "  3. Run 'npm run db:migrate' to setup database"
echo "  4. Run 'npm run seed' to seed data"
echo "  5. Access the app at http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run docker:compose:up    - Start all services"
echo "  npm run k8s:deploy   - Deploy to Kubernetes"
echo "  npm run ci:all       - Run all CI checks"
echo ""
