# Encryption

Data encryption at rest and in transit with enterprise-grade security standards.

## Encryption at Rest

```yaml
encryption:
  atRest:
    enabled: true
    algorithm: AES-256-GCM
    keyRotation: 90d
```

## Encryption in Transit

- TLS 1.3 for all connections
- Certificate auto-renewal
- Perfect Forward Secrecy
- HSTS headers

## Key Management

```bash
# Generate encryption keys
deployio keys generate --type encryption

# Rotate keys
deployio keys rotate --key-id abc123

# Backup keys
deployio keys backup --secure
```

## Compliance

- FIPS 140-2 Level 3
- Common Criteria EAL4+
- SOC 2 Type II
- ISO 27001
