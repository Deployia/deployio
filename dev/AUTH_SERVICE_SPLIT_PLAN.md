# Auth Service Splitting Plan

## Current State

- **authService.js**: 2007 lines - TOO LARGE
- Contains: Registration, Login, 2FA, OAuth, Password Reset, Session Management, Rate Limiting

## Proposed Split (6 focused services):

### 1. `coreAuthService.js` (300-400 lines)

- User registration
- Email/password login
- Token generation/validation
- Basic authentication flow

### 2. `passwordService.js` (200-300 lines)

- Password validation/policies
- Password reset flow
- Password history management
- Password strength checking

### 3. `twoFactorService.js` (250-350 lines)

- 2FA secret generation
- TOTP verification
- Backup codes management
- 2FA enable/disable

### 4. `oauthService.js` (200-300 lines)

- Google OAuth flow
- GitHub OAuth flow
- OAuth callback handling
- Provider token management

### 5. `sessionService.js` (300-400 lines)

- Refresh token rotation
- Session management
- Active sessions tracking
- Session revocation

### 6. `securityService.js` (400-500 lines)

- Rate limiting logic
- Account lockout
- Security monitoring
- Audit logging

## Benefits:

- ✅ Easier maintenance
- ✅ Better testing isolation
- ✅ Clearer responsibilities
- ✅ Reduced file complexity

## Implementation Time: ~2 hours
