# DeployIO

[![CI/CD Pipeline](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/deploy.yml)
[![Security Scan](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml/badge.svg)](https://github.com/vasudevshetty/deployio/actions/workflows/security.yml)

> **Automated Deployment Platform** - A full-stack application with complete CI/CD pipeline, authentication, and deployment automation.

## 🚀 Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/vasudevshetty/deployio.git
cd deployio
npm install
cd client && npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start development
npm run dev

# 4. Deploy to production (automatic)
git push origin main
```

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + JWT Authentication
- **API Service**: FastAPI + Python
- **Database**: MongoDB
- **Proxy**: Traefik (SSL/TLS + Let's Encrypt)
- **Deployment**: Docker Compose on EC2
- **CI/CD**: GitHub Actions (5-stage pipeline)

## 📊 Live Demo

- **🌐 Production**: [https://deployio.tech](https://deployio.tech)
- **📋 Health Dashboard**: [https://deployio.tech/health](https://deployio.tech/health)
- **🔧 API Status**: [https://deployio.tech/api/v1/health](https://deployio.tech/api/v1/health)

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication with HTTP-only cookies
- OAuth integration (Google, GitHub)
- Two-Factor Authentication (2FA) with TOTP
- Password reset with email verification
- Session management
- Rate limiting and security headers

### 🚀 CI/CD Pipeline

- **5-Stage Pipeline**: Quality → Security → Testing → Building → Deployment
- Automated testing (Frontend, Backend, FastAPI)
- Security vulnerability scanning
- Docker image building with caching
- Automatic deployment to EC2
- Health checks and rollback on failure

### 🛡️ Security Features

- Docker security optimization
- Traefik reverse proxy with SSL
- Environment-based CORS configuration
- Input validation and sanitization
- Automated security scanning

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- MongoDB

### Development Setup

1. **Install dependencies**

```bash
npm install
cd client && npm install
cd ../fastapi_service && pip install -r requirements.txt
```

2. **Environment configuration**

```bash
cp .env.example .env
# Configure your environment variables
```

3. **Start development servers**

```bash
npm run dev  # Starts all services concurrently
```

### Production Deployment

The application auto-deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**Prerequisites for deployment:**

- Add `SSH_PRIVATE_KEY` to GitHub repository secrets
- EC2 instance with Docker configured
- Domain configured with Traefik

## 📁 Project Structure

```
deployio/
├── 📱 client/                 # React frontend
├── 🐍 fastapi_service/        # Python FastAPI service
├── ⚙️ config/                 # App configuration
├── 🛡️ middleware/             # Express middleware
├── 📊 models/                 # Database models
├── 🛣️ routes/                 # API routes
├── 🔧 scripts/               # Deployment & utility scripts
├── 📚 docs/                  # Documentation
├── 🐳 docker-compose.yml     # Container orchestration
└── 🔄 .github/workflows/     # CI/CD pipelines
```

## 🛠️ Available Scripts

### Development

```bash
npm run dev        # Start all services in development
npm run server     # Start backend only
npm run client     # Start frontend only
npm run fastapi    # Start FastAPI service only
```

### Production

```bash
npm run docker     # Build and start with Docker
npm run deploy     # Deploy with docker-compose
npm run health     # Check health endpoints
```

### Testing & Validation

```bash
# Test deployment readiness
./scripts/test-deployment.sh

# Verify complete CI/CD setup
./scripts/verify-cicd.sh

# Security scan
./scripts/security-check.sh

# Production deployment
./scripts/deploy-production.sh

# Backup production data
./scripts/backup-production.sh
```

## 📚 Documentation

| Document                                                         | Description                     |
| ---------------------------------------------------------------- | ------------------------------- |
| **[🚀 CI/CD Complete Guide](docs/CI-CD-COMPLETE.md)**            | Complete pipeline documentation |
| **[🔐 2FA Implementation](docs/2FA-IMPLEMENTATION-COMPLETE.md)** | Two-factor authentication guide |
| **[🐳 Docker Security](docs/DOCKER-SECURITY.md)**                | Container security practices    |
| **[☁️ EC2 Deployment](docs/EC2-DEPLOYMENT-SECURITY.md)**         | Cloud deployment security       |
| **[🔒 Traefik Config](docs/TRAEFIK-CONFIG.md)**                  | Reverse proxy configuration     |
| **[📋 GitHub Badges](docs/GitHub-Badges.md)**                    | Status badges for README        |
| **[⚙️ Environment Config](docs/ENV-CONFIG.md)**                  | Environment setup guide         |

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```bash
# Database
MONGO_URI=mongodb://localhost:27017/deployio

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id

# Email (for password reset)
EMAIL_USER=your_email@domain.com
EMAIL_PASSWORD=your_app_password
```

## 🚀 Deployment Pipeline

### Automatic Deployment (Recommended)

1. **Push to main branch** → Triggers CI/CD pipeline
2. **GitHub Actions runs 5 stages**:
   - ✅ Code Quality & Linting
   - ✅ Security Vulnerability Scanning
   - ✅ Testing (Frontend, Backend, FastAPI)
   - ✅ Docker Image Building
   - ✅ Production Deployment

### Manual Deployment

```bash
# Deploy to production manually
./scripts/deploy-production.sh

# Backup before deployment
./scripts/backup-production.sh
```

## 🛡️ Security

- **HTTPS everywhere** with automatic SSL certificates
- **Security headers** via Helmet.js
- **Rate limiting** on authentication endpoints
- **Input validation** and sanitization
- **Docker security** with non-root users and read-only containers
- **Automated vulnerability scanning** in CI/CD

## 🔍 Monitoring

### Health Checks

- **Backend**: `/api/v1/health`
- **FastAPI**: `/health`
- **Frontend**: Health dashboard at `/health`

### CI/CD Monitoring

- View pipeline status in GitHub Actions
- Automatic notifications on deployment success/failure
- Health verification after deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

**Common issues and solutions:**

| Problem              | Solution                                             |
| -------------------- | ---------------------------------------------------- |
| CI/CD pipeline fails | Check GitHub secrets, review logs in Actions tab     |
| Health checks fail   | Verify services are running: `docker-compose ps`     |
| Deployment fails     | Run `./scripts/test-deployment.sh` to validate setup |
| OAuth not working    | Verify client IDs and callback URLs                  |

For detailed troubleshooting, see the [CI/CD Complete Guide](docs/CI-CD-COMPLETE.md).

---

**⭐ If this project helped you, please give it a star!**

## 🎯 Next Steps

### For First-Time Setup

1. **Add SSH Secret to GitHub**:

   ```bash
   # Generate SSH key if you don't have one
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

   # Add private key to GitHub repository secrets as SSH_PRIVATE_KEY
   # Go to: Settings → Secrets and variables → Actions → New repository secret
   ```

2. **Push to trigger deployment**:

   ```bash
   git add .
   git commit -m "🚀 Initial deployment"
   git push origin main
   ```

3. **Monitor deployment**:
   - Watch GitHub Actions tab for pipeline progress
   - Check [https://deployio.tech](https://deployio.tech) once deployment completes

### For Ongoing Development

- Use feature branches and pull requests
- CI/CD runs automatically on every push to main
- All documentation is organized in [`docs/`](docs/) folder
- Health checks available at `/health` endpoints

### 📖 Complete Documentation

All documentation has been organized in the [`docs/`](docs/) folder:

- **[📚 Documentation Hub](docs/README.md)** - Start here for all guides
- **[⚡ Quick Start](QUICK-START.md)** - Get up and running in 3 steps

---

**🚀 Ready to deploy? Your complete CI/CD pipeline awaits!**
