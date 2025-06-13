# Trust Proxy and Rate Limiting Configuration

## How Trust Proxy Affects Rate Limiting

### Without Trust Proxy (`TRUST_PROXY=false`)

- Express uses the direct connection IP (usually the reverse proxy's internal IP)
- All requests appear to come from the same IP (the proxy server)
- Rate limiting becomes ineffective as all users share the same rate limit
- **Problem**: All users get rate limited together

### With Trust Proxy (`TRUST_PROXY=true`)

- Express reads the `X-Forwarded-For` header set by the reverse proxy
- Each user's real IP is detected correctly
- Rate limiting works per actual client IP
- **Solution**: Each user gets their own rate limit bucket

## Configuration by Environment

### Development (`NODE_ENV=development`)

```env
TRUST_PROXY=false
REDIS_URL=redis://localhost:6379
```

- Direct connections to the application server
- No reverse proxy in front
- Rate limiting uses direct connection IP

### Production (`NODE_ENV=production`)

```env
TRUST_PROXY=true
REDIS_URL=redis://redis:6379
```

- Behind Traefik/nginx/CloudFlare reverse proxy
- Proxy sets X-Forwarded-For headers
- Rate limiting uses real client IP from headers

## IP Detection Logic (in order of priority)

1. `req.ip` - Express detected IP (respects trust proxy setting)
2. `X-Forwarded-For` header (first IP in comma-separated list)
3. Connection remote address (fallback)
4. "unknown" (last resort)

## Rate Limiting Tiers

- **General API**: 1000 requests per 15 minutes
- **Auth Login**: 5 attempts per 15 minutes
- **Auth Register**: 5 attempts per hour
- **Password Reset**: 3 attempts per hour
- **OTP Requests**: 3 attempts per 10 minutes
- **Profile Updates**: 10 updates per 15 minutes
- **Password Changes**: 3 changes per hour

## Redis Store Benefits

- Distributed rate limiting across multiple server instances
- Persistent rate limit counters (survive server restarts)
- Better performance than in-memory stores
- Automatic cleanup of expired keys

## Security Considerations

- Only trust proxy headers from known/trusted reverse proxies
- Validate X-Forwarded-For headers to prevent IP spoofing
- Monitor rate limit violations for abuse patterns
- Use different limits for different sensitivity levels
