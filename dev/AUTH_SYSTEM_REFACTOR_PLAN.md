# Authentication System Refactor & OAuth Integration Plan

## Current System Analysis

### Architecture Overview

The current system uses a **hybrid JWT + Session approach** which creates several issues:

1. **JWT-based Authentication**: Used for API requests via cookies
2. **Session Tracking in User Model**: Stores session metadata in MongoDB
3. **OAuth Integration**: Attempts to bridge between stateless OAuth and stateful authentication

### Critical Issues Identified

#### 1. Session Mismatch Warnings

```
Session mismatch but user has valid sessions
{"userId":"...", "requestedSessionId":"...", "availableSessions":2}
```

- **Root Cause**: JWT contains sessionId that doesn't match stored sessions in User model
- **Impact**: Confusing logs, potential security concerns, inefficient validation

#### 2. OAuth Callback Authentication Flow

- **Issue**: OAuth callbacks require authenticated user but session context is lost during redirect
- **Current Workaround**: Manual JWT extraction from cookies (brittle)
- **Impact**: Unreliable OAuth integration, poor user experience

#### 3. Mixed Authentication Paradigms

- **Issue**: System tries to be both stateless (JWT) and stateful (sessions)
- **Impact**: Complexity, maintenance burden, potential security gaps

## Recommended Solutions

### Phase 1: Immediate OAuth Fix (State-Based OAuth)

#### Implementation Approach: Secure State Parameter

Instead of relying on sessions or JWT cookies during OAuth, use OAuth state parameter:

```javascript
// 1. Initial OAuth Request
const state = base64encode({
  userId: user._id,
  timestamp: Date.now(),
  nonce: crypto.randomBytes(16).toString("hex"),
  provider: "github",
});

// 2. OAuth Provider Redirect
redirect(
  `https://github.com/login/oauth/authorize?client_id=...&state=${state}`
);

// 3. Callback Validation
const decodedState = base64decode(req.query.state);
// Validate timestamp (within 10 minutes)
// Validate user exists
// Validate nonce uniqueness (prevent replay attacks)
```

**Benefits:**

- No dependency on sessions or cookies during OAuth
- Secure against CSRF and replay attacks
- Works with any authentication system
- OAuth 2.0 standard compliance

#### Files to Modify:

1. `server/controllers/git/connectController.js`
2. `server/routes/api/v1/git/connect.js`
3. `server/config/strategies/githubStrategy.js`
4. `client/src/pages/dashboard/Integrations.jsx`

### Phase 2: Authentication System Cleanup (Post-OAuth Fix)

#### Option A: Pure JWT Stateless (Recommended)

- Remove session tracking from User model
- Simplify authMiddleware to JWT-only validation
- Use Redis for blacklisted/invalid tokens (optional)

#### Option B: Full Session-Based

- Add express-session middleware
- Remove JWT system
- Use traditional session-based authentication

#### Option C: Hybrid with Clear Separation

- Keep JWT for API authentication
- Use sessions only for OAuth state management
- Clear documentation of when to use each

**Recommendation**: Go with **Option A (Pure JWT)** for simplicity and scalability.

## Implementation Plan

### Step 1: Fix OAuth Flow (Priority 1)

**Goal**: Make OAuth integration work reliably without breaking current auth

**Changes:**

1. Implement state-based OAuth initialization
2. Update OAuth callback to validate state instead of requiring auth middleware
3. Add proper error handling and user feedback
4. Update frontend to handle OAuth success/failure

**Timeline**: 1-2 hours

### Step 2: Frontend OAuth Integration (Priority 2)

**Goal**: Smooth user experience for connecting git providers

**Changes:**

1. Add OAuth callback URL handling
2. Update Redux state after successful connection
3. Show connection status and errors
4. Implement disconnect functionality

**Timeline**: 1 hour

### Step 3: Authentication Cleanup (Priority 3)

**Goal**: Remove confusion and simplify auth system

**Changes:**

1. Remove session tracking from User model
2. Simplify authMiddleware
3. Update documentation
4. Clean up unused code

**Timeline**: 2-3 hours

### Step 4: Enhanced Security (Priority 4)

**Goal**: Production-ready security measures

**Changes:**

1. Token refresh mechanism
2. Rate limiting for OAuth endpoints
3. Audit logging for auth events
4. CSRF protection enhancements

**Timeline**: 2-4 hours

## Detailed Implementation Guide

### State-Based OAuth Implementation

#### 1. OAuth State Generation

```javascript
// In connectController.js
const generateOAuthState = (userId, provider) => {
  const stateData = {
    userId: userId.toString(),
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
    provider,
  };
  return Buffer.from(JSON.stringify(stateData)).toString("base64url");
};
```

#### 2. OAuth State Validation

```javascript
const validateOAuthState = (stateString) => {
  try {
    const stateData = JSON.parse(Buffer.from(stateString, 'base64url').toString());

    // Validate timestamp (10 minutes max)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      throw new Error('OAuth state expired');
    }

    // Validate user exists
    const user = await User.findById(stateData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return { user, provider: stateData.provider, nonce: stateData.nonce };
  } catch (error) {
    throw new Error('Invalid OAuth state');
  }
};
```

#### 3. Updated OAuth Routes

```javascript
// GET /api/v1/git/connect/:provider - Protected route
router.get("/:provider", protect, (req, res, next) => {
  const { provider } = req.params;
  const state = generateOAuthState(req.user._id, provider);

  // Store state temporarily for validation (optional Redis cache)
  req.session.oauthState = state; // If using sessions

  passport.authenticate(provider, { state })(req, res, next);
});

// GET /api/v1/git/connect/:provider/callback - Public route (no protect middleware)
router.get(
  "/:provider/callback",
  (req, res, next) => {
    const { state } = req.query;

    if (!state) {
      return res.redirect("/dashboard/integrations?error=missing_state");
    }

    passport.authenticate(req.params.provider, { state })(req, res, next);
  },
  connectController.handleCallback
);
```

### Frontend OAuth Handling

#### 1. OAuth Callback URL Detection

```javascript
// In Integrations.jsx useEffect
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const connected = urlParams.get("connected");
  const status = urlParams.get("status");
  const error = urlParams.get("error");

  if (connected && status) {
    if (status === "success") {
      dispatch(setConnectionStatus({ provider: connected, connected: true }));
      // Show success message
    } else if (status === "error") {
      // Show error message
      console.error("OAuth error:", error);
    }

    // Clean URL
    window.history.replaceState({}, "", "/dashboard/integrations");
  }
}, [dispatch]);
```

#### 2. Connection State Management

```javascript
// In gitProviderSlice.js
const gitProviderSlice = createSlice({
  name: "gitProvider",
  initialState: {
    providers: {},
    loading: false,
    error: null,
  },
  reducers: {
    setConnectionStatus: (state, action) => {
      const { provider, connected } = action.payload;
      state.providers[provider] = {
        ...state.providers[provider],
        isConnected: connected,
        connectedAt: connected ? new Date().toISOString() : null,
      };
    },
    // ... other reducers
  },
});
```

## Risk Assessment

### Low Risk Changes

- State-based OAuth implementation
- Frontend callback handling
- Error message improvements

### Medium Risk Changes

- Removing session tracking from User model
- Simplifying authMiddleware

### High Risk Changes

- Complete authentication system overhaul
- Changing JWT token structure

## Success Metrics

### Phase 1 Success Criteria

- [ ] OAuth integration works without session mismatch warnings
- [ ] Users can successfully connect GitHub/GitLab
- [ ] OAuth errors are handled gracefully
- [ ] Frontend shows connection status correctly

### Phase 2 Success Criteria

- [ ] No authentication-related errors in logs
- [ ] Clear separation between OAuth and regular authentication
- [ ] Documentation updated and clear
- [ ] All tests passing

## Next Steps

1. **Implement state-based OAuth** (this session)
2. **Test OAuth flow end-to-end**
3. **Update frontend integration handling**
4. **Plan authentication cleanup** (future session)

This plan provides a clear path forward while minimizing risk and maintaining system stability.
