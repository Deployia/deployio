# EC2 Deployment Security Checklist for DeployIO

## 🚀 Production Deployment Security Framework

This comprehensive guide ensures secure deployment of the DeployIO MERN + FastAPI stack on AWS EC2 with Docker.

---

## 📋 Pre-Deployment Security Checklist

### **1. AWS EC2 Instance Security**

#### **Instance Configuration** ✅

- [ ] **AMI Selection**: Use latest Amazon Linux 2023 or Ubuntu 22.04 LTS
- [ ] **Instance Type**: Choose appropriate size (t3.medium+ for production)
- [ ] **Key Pair**: Create dedicated EC2 key pair (store securely)
- [ ] **IAM Role**: Create minimal-privilege IAM role for EC2 instance

#### **Security Groups** ✅

```bash
# Recommended Security Group Rules
Inbound:
- SSH (22): Your IP only / Bastion host only
- HTTP (80): 0.0.0.0/0 (for Let's Encrypt validation)
- HTTPS (443): 0.0.0.0/0 (public access)
- Custom (3000): Load balancer only (if using ALB)
- Custom (8000): Load balancer only (if using ALB)

Outbound:
- All traffic: 0.0.0.0/0 (for package updates and external APIs)
```

#### **VPC Configuration** ✅

- [ ] **Private Subnet**: Deploy application servers in private subnets
- [ ] **Public Subnet**: Place load balancer in public subnet
- [ ] **NAT Gateway**: Enable internet access for private subnets
- [ ] **VPC Flow Logs**: Enable for network monitoring

### **2. System Hardening**

#### **Operating System Security** ✅

```bash
# System updates and hardening script
sudo apt update && sudo apt upgrade -y
sudo apt install -y fail2ban ufw unattended-upgrades

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Firewall configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# SSH hardening
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

#### **User Management** ✅

```bash
# Create deployment user
sudo adduser deployio
sudo usermod -aG docker deployio
sudo usermod -aG sudo deployio

# Configure SSH access for deployment user
sudo mkdir -p /home/deployio/.ssh
sudo cp ~/.ssh/authorized_keys /home/deployio/.ssh/
sudo chown -R deployio:deployio /home/deployio/.ssh
sudo chmod 700 /home/deployio/.ssh
sudo chmod 600 /home/deployio/.ssh/authorized_keys
```

### **3. Docker Security on EC2**

#### **Docker Installation & Hardening** ✅

```bash
# Install Docker with security considerations
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deployio

# Docker daemon security configuration
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json"
}
EOF

sudo systemctl restart docker
```

### **4. Environment Variables Security**

#### **Production Secrets Management** ✅

```bash
# Create secure environment files directory
sudo mkdir -p /opt/deployio/secrets
sudo chown deployio:deployio /opt/deployio/secrets
sudo chmod 700 /opt/deployio/secrets

# Store production environment variables securely
sudo tee /opt/deployio/secrets/.env.production << EOF
# Database
MONGODB_URI=mongodb://mongodb:27017/deployio_prod

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL_PROD=https://deployio.tech

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=$(openssl rand -hex 32)

# OAuth (Replace with actual values)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret
EOF

sudo chmod 600 /opt/deployio/secrets/.env.production
```

---

## 🔐 Security Monitoring & Logging

### **1. Application Monitoring**

#### **Log Management** ✅

```bash
# Configure application logging
sudo mkdir -p /var/log/deployio
sudo chown deployio:deployio /var/log/deployio

# Logrotate configuration
sudo tee /etc/logrotate.d/deployio << EOF
/var/log/deployio/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deployio deployio
}
EOF
```

#### **Container Monitoring** ✅

```bash
# Install Docker monitoring tools
docker run -d \
  --name=cadvisor \
  --restart=always \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=8080:8080 \
  --detach=true \
  gcr.io/cadvisor/cadvisor:latest
```

### **2. Security Scanning**

#### **Vulnerability Scanning** ✅

```bash
# Install and configure security scanning tools
# Docker Scout (built into Docker)
docker scout quickview

# Trivy for comprehensive scanning
sudo apt install -y wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt update
sudo apt install -y trivy

# Scan container images
trivy image deployio:latest
```

---

## 🌐 Reverse Proxy & Load Balancing

### **Traefik Configuration** ✅

DeployIO uses Traefik as the reverse proxy with automatic SSL certificate management via Let's Encrypt. **No manual certificate setup or nginx configuration is required** - Traefik handles everything automatically.

```yaml
# docker-compose.yml - Traefik service
traefik:
  image: traefik:v3.0
  container_name: traefik
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./letsencrypt:/letsencrypt
  command:
    - --api.dashboard=true
    - --providers.docker=true
    - --providers.docker.exposedbydefault=false
    - --entrypoints.web.address=:80
    - --entrypoints.websecure.address=:443
    - --certificatesresolvers.letsencrypt.acme.email=your-email@domain.com
    - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
```

### **Service Labels for Traefik**

Each service in docker-compose.yml includes Traefik labels:

```yaml
# Frontend service labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend.rule=Host(`deployio.tech`)"
  - "traefik.http.routers.frontend.entrypoints=websecure"
  - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

# Backend API labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.backend.rule=Host(`deployio.tech`) && PathPrefix(`/api`)"
  - "traefik.http.routers.backend.entrypoints=websecure"
  - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
```

### **Automatic HTTPS Redirect**

Traefik automatically redirects HTTP to HTTPS and manages SSL certificates:

```yaml
# Automatic HTTP to HTTPS redirect
- --entrypoints.web.http.redirections.entrypoint.to=websecure
- --entrypoints.web.http.redirections.entrypoint.scheme=https
```

### **Security Headers**

Security headers are configured in Traefik middleware:

```yaml
# Add to docker-compose.yml
labels:
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
```

---

## 📊 Health Checks & Monitoring

### **Application Health Endpoints** ✅

#### **Backend Health Check** (Already implemented)

```javascript
// GET /api/v1/health
{
  "status": "OK",
  "timestamp": "2024-12-XX",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

#### **FastAPI Health Check** (Already implemented)

```python
# GET /health
{
  "status": "OK",
  "timestamp": "2024-12-XX"
}
```

### **Monitoring Script** ✅

```bash
#!/bin/bash
# /opt/deployio/scripts/health-monitor.sh

BACKEND_URL="http://localhost:3000/api/v1/health"
FASTAPI_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:5173"

# Check backend health
if curl -f $BACKEND_URL > /dev/null 2>&1; then
    echo "$(date): Backend health OK" >> /var/log/deployio/health.log
else
    echo "$(date): Backend health FAILED" >> /var/log/deployio/health.log
    # Restart backend service if needed
    docker-compose restart backend
fi

# Check FastAPI health
if curl -f $FASTAPI_URL > /dev/null 2>&1; then
    echo "$(date): FastAPI health OK" >> /var/log/deployio/health.log
else
    echo "$(date): FastAPI health FAILED" >> /var/log/deployio/health.log
    # Restart FastAPI service if needed
    docker-compose restart fastapi
fi

# Schedule this script to run every 5 minutes
# crontab -e
# */5 * * * * /opt/deployio/scripts/health-monitor.sh
```

---

## 🔧 Backup & Recovery

### **Database Backup Strategy** ✅

```bash
#!/bin/bash
# /opt/deployio/scripts/backup-mongodb.sh

BACKUP_DIR="/opt/deployio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="mongodb://localhost:27017"
DATABASE_NAME="deployio_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB backup
docker exec deployio_mongodb mongodump --uri=$MONGODB_URI --db=$DATABASE_NAME --out=/tmp/backup_$DATE
docker cp deployio_mongodb:/tmp/backup_$DATE $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

# Schedule daily backups
# crontab -e
# 0 2 * * * /opt/deployio/scripts/backup-mongodb.sh
```

---

## 📈 Performance Optimization

### **Production Docker Compose** ✅

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  mongodb:
    image: mongo:7.0-jammy
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - deployio-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "0.5"

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
    env_file:
      - /opt/deployio/secrets/.env.production
    depends_on:
      - mongodb
    networks:
      - deployio-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.25"

  fastapi:
    build:
      context: ./ai_service
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      ENVIRONMENT: production
    env_file:
      - /opt/deployio/secrets/fastapi.env.production
    depends_on:
      - backend
    networks:
      - deployio-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.25"

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
    networks:
      - deployio-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: "0.25"

volumes:
  mongodb_data:

networks:
  deployio-network:
    driver: bridge
```

---

## ✅ Deployment Verification Checklist

### **Post-Deployment Security Verification**

- [ ] **SSL Certificate**: Verify HTTPS works correctly
- [ ] **Security Headers**: Test with SSL Labs or SecurityHeaders.com
- [ ] **API Endpoints**: Verify all endpoints require authentication
- [ ] **CORS Configuration**: Confirm production CORS settings
- [ ] **Environment Variables**: Ensure no development secrets in production
- [ ] **Docker Security**: Run security scanning on deployed containers
- [ ] **Firewall Rules**: Verify only necessary ports are open
- [ ] **Backup System**: Test backup and restore procedures
- [ ] **Monitoring**: Confirm all monitoring systems are active
- [ ] **Health Checks**: Verify application health endpoints respond correctly

### **Performance Verification**

- [ ] **Load Testing**: Test application under expected load
- [ ] **Database Performance**: Monitor MongoDB performance metrics
- [ ] **Response Times**: Verify API response times are acceptable
- [ ] **Resource Usage**: Monitor CPU, memory, and disk usage
- [ ] **CDN Configuration**: Set up CloudFront for static assets (if needed)

---

## 🚨 Incident Response Plan

### **Security Incident Response**

1. **Detection**: Monitor logs and alerts for suspicious activity
2. **Containment**: Isolate affected systems immediately
3. **Investigation**: Analyze logs to determine scope of compromise
4. **Recovery**: Restore systems from clean backups
5. **Communication**: Notify stakeholders and users if data is affected
6. **Post-Incident**: Review and improve security measures

### **Emergency Contacts**

- **System Administrator**: [Your contact information]
- **Security Team**: [Security team contact]
- **AWS Support**: [AWS support case URL]

---

**Last Updated**: December 2024  
**Security Level**: Production-Ready  
**Compliance**: SOC 2, GDPR-Ready  
**Next Review**: Quarterly
