# 🚀 Quick Cloudflare & Environment Setup Guide

## Step 1: Cloudflare API Token Setup

### 🔗 **Get Your API Token**

1. **Login**: Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Profile**: Click your profile icon → **"My Profile"**
3. **API Tokens**: Click **"API Tokens"** tab
4. **Create Token**: Click **"Create Token"**

### ⚙️ **Token Configuration**

```
Token Name: DeployIO DNS Management

Permissions:
✅ Zone:DNS:Edit
✅ Zone:Zone:Read

Zone Resources:
✅ Include: Specific zone → deployio.tech

Client IP Address Filtering: (leave empty)
TTL: (leave empty for no expiration)
```

### 📋 **Copy Token**

- Copy the token immediately (you won't see it again!)
- Format: `1234567890abcdef1234567890abcdef12345678`

---

## Step 2: Update Your .env.production

### 🔧 **Required Changes**

Open your `.env.production` file and update these values:

```bash
# 1. ADD YOUR CLOUDFLARE EMAIL
CLOUDFLARE_EMAIL=your-actual-email@example.com

# 2. YOUR API TOKEN IS ALREADY SET
CLOUDFLARE_DNS_API_TOKEN=K6NFA85FYULP1Q2Kp6VMcg0H9PR6rmbs32KDkVe5

# 3. GENERATE A STRONG SECRET KEY (32+ characters)
SECRET_KEY=generate-a-random-32-character-string-here

# 4. UPDATE AGENT SECRET IF NEEDED
AGENT_SECRET=another-secure-random-string-here
```

### 🔐 **Generate Secure Keys**

```bash
# Generate SECRET_KEY (Linux/Mac)
openssl rand -base64 32

# Generate SECRET_KEY (Windows PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# Or use online generator: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

---

## Step 3: Verify DNS Setup

### 🌐 **Check Your DNS Records**

In Cloudflare Dashboard → DNS:

```
Type: A    Name: *      Content: YOUR_SERVER_IP    Proxy: DNS only ☁️
Type: A    Name: @      Content: YOUR_SERVER_IP    Proxy: DNS only ☁️
```

### 🧪 **Test DNS Propagation**

```bash
# Test wildcard
nslookup agent.deployio.tech
nslookup test.deployio.tech

# Should return your server IP
```

---

## Step 4: Deploy

### 🐋 **Start the Stack**

```bash
# Create letsencrypt directory
mkdir -p letsencrypt
chmod 600 letsencrypt

# Start services
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### ✅ **Verify Everything Works**

```bash
# Check certificate generation (wait 2-3 minutes)
docker-compose logs traefik | grep -i certificate

# Test endpoints
curl -I https://agent.deployio.tech/agent/v1/health
curl -I https://traefik.deployio.tech
curl -I https://anything.deployio.tech
```

---

## 🎯 **What You Should See**

| URL                                           | Expected Response             |
| --------------------------------------------- | ----------------------------- |
| `https://agent.deployio.tech/agent/v1/health` | ✅ 200 OK (FastAPI health)    |
| `https://traefik.deployio.tech`               | ✅ 200 OK (Traefik dashboard) |
| `https://random.deployio.tech`                | ✅ 200 OK (Your HTML page)    |
| `https://test123.deployio.tech`               | ✅ 200 OK (Your HTML page)    |

---

## 🆘 **Troubleshooting**

### SSL Certificate Issues

```bash
# Check Traefik logs
docker-compose logs traefik | grep -i error

# Verify API token permissions
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### DNS Issues

```bash
# Check DNS propagation
dig agent.deployio.tech
dig @1.1.1.1 agent.deployio.tech

# Test from different locations
nslookup agent.deployio.tech 8.8.8.8
```

### Service Issues

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs deployio-agent
docker-compose logs wildcard-server
```

---

## 📝 **Quick Checklist**

- [ ] Cloudflare API token created with correct permissions
- [ ] CLOUDFLARE_EMAIL added to .env.production
- [ ] SECRET_KEY generated and added
- [ ] DNS records pointing to your server
- [ ] letsencrypt directory created
- [ ] docker-compose up -d executed
- [ ] All endpoints responding with SSL

**Ready to deploy? Your setup should work perfectly! 🚀**
