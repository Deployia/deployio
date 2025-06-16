# Access Control

Role-based access control and permission management for teams and organizations.

## Role-Based Access Control (RBAC)

```yaml
roles:
  developer:
    permissions:
      - projects:read
      - deployments:write

  admin:
    permissions:
      - "*"

  viewer:
    permissions:
      - projects:read
      - deployments:read
```

## Team Management

```bash
# Add team member
deployio team add user@company.com --role developer

# Update permissions
deployio team update user@company.com --role admin

# Remove access
deployio team remove user@company.com
```

## Multi-Factor Authentication

- TOTP (Google Authenticator, Authy)
- SMS verification
- Hardware tokens (YubiKey)
- Biometric authentication

## Single Sign-On (SSO)

- SAML 2.0
- OpenID Connect
- Active Directory
- Okta, Auth0 integration
