# DeployIO Agent - Docker Compose Setup

This setup provides a complete infrastructure with:

- **Traefik** as reverse proxy with automatic SSL via Cloudflare DNS
- **FastAPI service** accessible at `agent.deployio.tech`
- **Wildcard routing** for all other subdomains to serve a static HTML page

## Prerequisites

1. **Cloudflare Account** with your domain managed by Cloudflare
2. **Docker** and **Docker Compose** installed
3. **Domain** pointed to your server's IP address

## Setup Instructions

### 1. Cloudflare Configuration

1. Go to Cloudflare Dashboard → Your Domain → DNS
2. Create an A record pointing `*.deployio.tech` to your server IP
3. Go to My Profile → API Tokens
4. Create a new token with permissions:
   - Zone:DNS:Edit for your domain
   - Zone:Zone:Read for your domain

### 2. Environment Configuration

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your details:
   ```bash
   CLOUDFLARE_EMAIL=your-email@example.com
   CLOUDFLARE_DNS_API_TOKEN=your-api-token
   SECRET_KEY=your-secure-secret-key
   ```

### 3. Create Required Directories

```bash
mkdir -p letsencrypt
chmod 600 letsencrypt
```

### 4. Deploy the Stack

```bash
docker-compose up -d
```

## Service Endpoints

| Subdomain               | Service           | Description                            |
| ----------------------- | ----------------- | -------------------------------------- |
| `agent.deployio.tech`   | FastAPI Agent     | Main API service                       |
| `traefik.deployio.tech` | Traefik Dashboard | Monitoring and configuration           |
| `*.deployio.tech`       | Wildcard Page     | Any other subdomain serves static page |

## Reserved Subdomains

The following subdomains are excluded from wildcard routing:

- `agent.deployio.tech` - FastAPI service
- `traefik.deployio.tech` - Traefik dashboard
- `api.deployio.tech` - Reserved for future API
- `app.deployio.tech` - Reserved for web app
- `www.deployio.tech` - Reserved for website

## SSL Certificate

The setup automatically obtains wildcard SSL certificates (`*.deployio.tech`) using:

- **ACME DNS Challenge** via Cloudflare
- **Automatic renewal** handled by Traefik
- **Certificate storage** in `./letsencrypt/acme.json`

## Monitoring

- **Traefik Dashboard**: `https://traefik.deployio.tech` (admin/admin - change this!)
- **Agent Health**: `https://agent.deployio.tech/agent/v1/health`
- **Wildcard Health**: `https://anysubdomain.deployio.tech/health`

## Configuration Files

- `docker-compose.yml` - Main orchestration
- `nginx-wildcard.conf` - Nginx config for wildcard server
- `traefik/dynamic.yml` - Additional Traefik configuration
- `.env` - Environment variables

## Logs

View logs for specific services:

```bash
# All services
docker-compose logs -f

# Traefik only
docker-compose logs -f traefik

# Agent only
docker-compose logs -f deployio-agent

# Wildcard server only
docker-compose logs -f wildcard-server
```

## Troubleshooting

1. **SSL Certificate Issues**:

   - Check Cloudflare API token permissions
   - Verify DNS propagation: `dig agent.deployio.tech`
   - Check Traefik logs: `docker-compose logs traefik`

2. **Routing Issues**:

   - Verify Docker labels in services
   - Check Traefik dashboard for active routers
   - Test DNS resolution

3. **Agent Service Issues**:
   - Check FastAPI logs: `docker-compose logs deployio-agent`
   - Verify database connectivity
   - Test health endpoint

## Security Notes

- Change default Traefik dashboard credentials
- Use strong secret keys
- Limit Cloudflare API token permissions
- Regular security updates for base images
- Monitor access logs

## Adding New Services

To add new services with specific subdomains, add them to the docker-compose.yml with appropriate Traefik labels and exclude them from the wildcard router rule.

Example for a new service at `newservice.deployio.tech`:

```yaml
newservice:
  image: your-service:latest
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.newservice.rule=Host(`newservice.deployio.tech`)"
    - "traefik.http.routers.newservice.entrypoints=websecure"
    - "traefik.http.routers.newservice.tls.certresolver=cloudflare"
    - "traefik.http.routers.newservice.service=newservice-service"
    - "traefik.http.services.newservice-service.loadbalancer.server.port=8080"
```

Then update the wildcard router rule to exclude it:

```yaml
- "traefik.http.routers.wildcard.rule=HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.deployio.tech`) && !Host(`agent.deployio.tech`) && !Host(`traefik.deployio.tech`) && !Host(`newservice.deployio.tech`) && !Host(`api.deployio.tech`) && !Host(`app.deployio.tech`) && !Host(`www.deployio.tech`)"
```
