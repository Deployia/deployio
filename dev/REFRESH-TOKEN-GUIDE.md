# Refresh Token Usage in Deployio Platform

## What is a Refresh Token?

A **refresh token** is a long-lived authentication credential used to obtain new access tokens without requiring the user to log in again. It's part of a secure authentication pattern that provides both security and user convenience.

## Why Use Refresh Tokens?

### 1. **Security Benefits**
- **Short-lived Access Tokens**: Access tokens expire quickly (1 day in your app), limiting the damage if compromised
- **Token Rotation**: Each refresh generates a new refresh token, invalidating the old one
- **Revocation**: Can invalidate all refresh tokens to force re-authentication
- **Reduced Credential Exposure**: Users don't need to re-enter passwords frequently

### 2. **User Experience**
- **Seamless Sessions**: Users stay logged in without interruption
- **Background Renewal**: Tokens refresh automatically without user action
- **Multi-device Support**: Each device/session gets its own refresh token

## How Refresh Tokens Work in Your App

### **Token Lifecycle**

```mermaid
graph TD
    A[User Login] --> B[Generate Access Token (1 day)]
    B --> C[Generate Refresh Token (7 days)]
    C --> D[Store Both as HTTP-only Cookies]
    D --> E[User Makes API Requests]
    E --> F{Access Token Valid?}
    F -->|Yes| G[Process Request]
    F -->|No/Expired| H[Auto-call /refresh-token]
    H --> I[Validate Refresh Token]
    I --> J{Refresh Token Valid?}
    J -->|Yes| K[Generate New Access + Refresh Tokens]
    J -->|No| L[Redirect to Login]
    K --> D
```

### **Token Storage & Security**

1. **HTTP-only Cookies**: Prevents XSS attacks
2. **Secure Flag**: HTTPS-only in production
3. **SameSite=Strict**: Prevents CSRF attacks
4. **Database Storage**: Refresh tokens stored in user document for validation

### **Token Rotation Security**

Your app implements **refresh token rotation**:
```javascript
// When refreshing tokens:
1. Validate incoming refresh token
2. Remove old refresh token from database
3. Generate new access token (1 day)
4. Generate new refresh token (7 days)
5. Store new refresh token
6. Return both tokens to client
```

## Implementation Details

### **Token Generation (Login/Signup)**
```javascript
// Location: controllers/authController.js (login/verifyOtp)
const payload = { id: user._id, sessionId: session._id.toString() };
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
```

### **Token Validation (API Requests)**
```javascript
// Location: middleware/authMiddleware.js
const decoded = jwt.verify(token, JWT_SECRET);
const user = await User.findById(decoded.id);
// Validate session exists and user is active
```

### **Token Refresh (Automatic)**
```javascript
// Location: controllers/authController.js (refreshToken endpoint)
1. Extract refresh token from cookies
2. Verify signature with JWT_REFRESH_SECRET
3. Check token exists in user's refreshTokens array
4. Remove old token (rotation)
5. Generate new access + refresh tokens
6. Update database atomically
7. Set new cookies
```

### **Token Storage Schema**
```javascript
// Location: models/User.js
refreshTokens: [{
  token: String,           // JWT refresh token
  expiresAt: Date,        // Expiration timestamp
  createdAt: Date         // Creation timestamp
}]
```

## API Endpoints

### **POST /api/v1/auth/refresh-token**
- **Purpose**: Get new access token using refresh token
- **Input**: Refresh token from HTTP-only cookie
- **Output**: New access + refresh tokens as cookies
- **Status Codes**:
  - `200`: Success - new tokens issued
  - `401`: No refresh token provided
  - `403`: Invalid/expired refresh token
  - `404`: User not found
  - `500`: Server error

### **Client-Side Integration**
Your frontend automatically handles token refresh:
```javascript
// When API returns 401 (token expired):
1. Frontend calls /refresh-token endpoint
2. If successful: retry original request
3. If failed: redirect to login page
```

## Security Features

### **Token Limits**
- **Max Tokens per User**: 5 refresh tokens (prevents token accumulation)
- **Automatic Cleanup**: Expired tokens removed during operations
- **Token Rotation**: Old tokens invalidated immediately

### **Session Tracking**
- **Session IDs**: Link tokens to specific login sessions
- **Device Tracking**: IP address and user agent stored
- **Session Validation**: Ensures token belongs to valid session

### **Redis Integration**
- **Fast Validation**: Tokens cached in Redis for quick lookup
- **TTL Management**: Automatic expiration in Redis
- **Fallback**: Works without Redis (database-only)

## Configuration

### **Environment Variables**
```bash
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret  
JWT_EXPIRES_IN=1d                           # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d                   # Refresh token expiry
JWT_COOKIE_EXPIRES_IN=7                     # Cookie expiry (days)
```

### **Token Lifetimes**
- **Access Token**: 1 day (short-lived for security)
- **Refresh Token**: 7 days (longer for convenience)
- **Cookies**: 7 days (matches refresh token)

## Error Handling

### **Common Scenarios**
1. **Access Token Expired**: Auto-refresh triggered
2. **Refresh Token Expired**: User must log in again
3. **Invalid Token**: Clear cookies, redirect to login
4. **User Deleted**: Token validation fails
5. **Session Revoked**: Token becomes invalid

## Benefits in Your Deployio Platform

1. **Deployment Workflows**: Users stay authenticated during long deployment processes
2. **Multi-tab Support**: Works across multiple browser tabs
3. **API Security**: Short-lived access tokens reduce risk
4. **User Experience**: Seamless authentication without interruption
5. **Device Management**: Each device gets independent refresh tokens
6. **Security Compliance**: Follows OAuth 2.0 best practices

This refresh token system provides robust, secure authentication while maintaining excellent user experience in your AI-powered DevOps platform.
