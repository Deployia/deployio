# Implementation Plan - Backend Model Alignment

## Project Overview

Complete migration of DeployIO backend controllers and services to align with the new normalized database models. This plan ensures a systematic, low-risk approach to updating all backend components.

## Implementation Strategy

### Approach: Incremental Migration

- **Phase-based implementation** to minimize risk
- **Backward compatibility** during transition
- **Comprehensive testing** at each phase
- **Rollback procedures** for each phase

---

## Phase 1: API Key Management Migration (CRITICAL)

### Overview

Migrate from embedded API key management in User model to dedicated ApiKey model with proper service architecture.

### 1.1 Create ApiKey Service Layer

#### File: `server/services/api/apiKeyService.js`

```javascript
const ApiKey = require("@models/ApiKey");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

class ApiKeyService {
  // Generate secure API key
  generateApiKey(type = "live") {
    const keyData = crypto.randomBytes(32).toString("hex");
    return `dp_${type}_${keyData}`;
  }

  // Create API key
  async createApiKey(userId, { name, description, permissions, expiresAt }) {
    // Validation logic
    // Duplicate name check
    // Permission validation
    // Key generation
    // Database save
  }

  // Get user's API keys
  async getUserApiKeys(userId, { includeInactive = false } = {}) {
    // Query with filters
    // Return safe data (no raw keys)
  }

  // Validate API key
  async validateApiKey(keyString) {
    // Parse key format
    // Find key in database
    // Check status and expiry
    // Update lastUsed
    // Return key with permissions
  }

  // Delete API key
  async deleteApiKey(keyId, userId) {
    // Ownership verification
    // Soft delete with audit trail
  }

  // Update API key
  async updateApiKey(keyId, userId, updates) {
    // Permission updates
    // Name, description changes
    // Status changes
  }
}

module.exports = new ApiKeyService();
```

### 1.2 Create ApiKey Controller

#### File: `server/controllers/api/apiKeyController.js`

```javascript
const apiKeyService = require("@services/api/apiKeyService");
const { getSafeApiKeyData } = require("@utils/dataFilters");

class ApiKeyController {
  // GET /api/v1/user/api-keys
  async getApiKeys(req, res) {
    // Get user's API keys
    // Apply filters
    // Return safe data
  }

  // POST /api/v1/user/api-keys
  async createApiKey(req, res) {
    // Validate input
    // Check limits
    // Create key
    // Return full key (one-time display)
  }

  // DELETE /api/v1/user/api-keys/:keyId
  async deleteApiKey(req, res) {
    // Validate ownership
    // Delete key
    // Return success
  }

  // PUT /api/v1/user/api-keys/:keyId
  async updateApiKey(req, res) {
    // Update key properties
    // Return updated key
  }
}

module.exports = new ApiKeyController();
```

### 1.3 Create API Key Routes

#### File: `server/routes/api/v1/user/api-keys.js`

```javascript
const express = require("express");
const router = express.Router();
const { protect } = require("@middleware/auth");
const apiKeyController = require("@controllers/api/apiKeyController");

router.use(protect); // All routes require authentication

router.get("/", apiKeyController.getApiKeys);
router.post("/", apiKeyController.createApiKey);
router.put("/:keyId", apiKeyController.updateApiKey);
router.delete("/:keyId", apiKeyController.deleteApiKey);

module.exports = router;
```

### 1.4 Create API Key Authentication Middleware

#### File: `server/middleware/apiKeyAuth.js`

```javascript
const apiKeyService = require("@services/api/apiKeyService");

const apiKeyAuth = async (req, res, next) => {
  try {
    // Extract API key from headers
    // Validate key format
    // Authenticate key
    // Check permissions
    // Set req.user and req.apiKey
    // Continue to next middleware
  } catch (error) {
    // Handle authentication errors
  }
};

module.exports = { apiKeyAuth };
```

### 1.5 Update User Controller

#### Remove from `server/controllers/user/userController.js`:

```javascript
// REMOVE these methods:
-getApiKeys -
  createApiKey -
  deleteApiKey -
  // REMOVE these imports:
  getSafeApiKeyData;

// UPDATE exports (remove API key methods)
```

### 1.6 Update User Service

#### Remove from `server/services/user/userService.js`:

```javascript
// REMOVE these methods:
-getApiKeys - createApiKey - deleteApiKey;

// UPDATE dashboard stats (use ApiKey model)
```

### 1.7 Update Routes

#### Update `server/routes/api/v1/user/users.js`:

```javascript
// REMOVE these routes:
// router.get("/api-keys", protect, user.user.getApiKeys);
// router.post("/api-keys", protect, user.user.createApiKey);
// router.delete("/api-keys/:keyId", protect, user.user.deleteApiKey);

// ADD:
const apiKeyRoutes = require("./api-keys");
router.use("/api-keys", apiKeyRoutes);
```

---

## Phase 2: Data Migration Script

### 2.1 Create Migration Script

#### File: `scripts/migrate-api-keys.js`

```javascript
const User = require("@models/User");
const ApiKey = require("@models/ApiKey");

const migrateApiKeys = async () => {
  // Find all users with embedded API keys
  // For each user:
  //   - Create new ApiKey records
  //   - Migrate permissions and metadata
  //   - Preserve creation dates
  //   - Update usage statistics
  // Validate migration
  // Generate report
};

// Run migration with rollback capability
```

### 2.2 Validation Script

#### File: `scripts/validate-api-key-migration.js`

```javascript
// Compare embedded vs migrated keys
// Validate key counts
// Check permission mappings
// Verify functionality
```

---

## Phase 3: Service Layer Updates

### 3.1 Project Service Updates

#### Verify `server/services/project/projectService.js`:

- Model import paths
- Relationship queries
- Cache invalidation patterns
- Error handling

### 3.2 Deployment Service Updates

#### Verify deployment services:

- BuildLog model integration
- Proper status tracking
- Container management
- Log aggregation

### 3.3 AI Service Integration

#### Verify AI services:

- Model references
- Error handling
- Permission checking (if applicable)

---

## Phase 4: Controller Verification

### 4.1 Systematic Controller Review

#### For each controller:

1. **Model Import Verification**

   ```javascript
   // Check all require statements
   const User = require("@models/User");
   const Project = require("@models/Project");
   // etc.
   ```

2. **Relationship Query Updates**

   ```javascript
   // Verify populate() calls
   // Check aggregation pipelines
   // Update join conditions
   ```

3. **Error Handling Updates**
   ```javascript
   // Model-specific error handling
   // Proper status codes
   // Consistent error messages
   ```

### 4.2 Performance Optimization

#### Database Queries:

- Add proper indexes
- Optimize aggregation pipelines
- Implement query caching
- Monitor query performance

#### Cache Strategy:

- Update cache keys
- Implement cache invalidation
- Add cache warming
- Monitor cache hit rates

---

## Phase 5: Testing & Validation

### 5.1 Unit Tests

#### API Key Management:

```javascript
// Test API key creation
// Test API key validation
// Test permission checking
// Test expiration handling
```

#### Model Relationships:

```javascript
// Test user-project relationships
// Test project-deployment relationships
// Test audit log creation
```

### 5.2 Integration Tests

#### Authentication Flow:

```javascript
// Test JWT authentication
// Test API key authentication
// Test permission validation
// Test rate limiting
```

#### API Endpoints:

```javascript
// Test all CRUD operations
// Test error scenarios
// Test edge cases
// Test performance
```

### 5.3 Security Testing

#### API Key Security:

- Key generation entropy
- Storage security (hashing)
- Permission enforcement
- Audit trail completeness

#### Access Control:

- User isolation
- Project access control
- Admin privilege escalation
- Rate limiting effectiveness

---

## Phase 6: Documentation & Deployment

### 6.1 API Documentation Updates

#### Update OpenAPI/Swagger specs:

- New API key endpoints
- Updated request/response schemas
- Authentication methods
- Permission requirements

### 6.2 Developer Documentation

#### Update development guides:

- API key management guide
- Authentication flow guide
- Permission system guide
- Migration guide

### 6.3 Deployment Strategy

#### Rolling Deployment:

1. Deploy new API key system (inactive)
2. Run migration script
3. Switch to new system
4. Monitor for issues
5. Remove legacy code

---

## Timeline & Resources

### Phase 1: API Key Migration (2-3 days)

- **Developer**: 1 senior developer
- **Tester**: 1 QA engineer
- **Risk**: High (breaking changes)

### Phase 2: Data Migration (1 day)

- **Developer**: 1 senior developer
- **DBA**: Database administrator (if needed)
- **Risk**: Medium (data integrity)

### Phase 3-4: Service/Controller Updates (2 days)

- **Developer**: 1-2 developers
- **Risk**: Low (non-breaking changes)

### Phase 5: Testing (2 days)

- **Tester**: 1-2 QA engineers
- **Developer**: 1 developer (bug fixes)
- **Risk**: Low (validation phase)

### Phase 6: Documentation & Deployment (1 day)

- **Developer**: 1 developer
- **DevOps**: 1 engineer
- **Risk**: Low (documentation)

### **Total Timeline: 8-10 days**

---

## Risk Mitigation

### High-Risk Items:

1. **API Key Migration**

   - Mitigation: Thorough testing, rollback plan
   - Backup: Keep legacy system as fallback

2. **Data Migration**

   - Mitigation: Dry run testing, data validation
   - Backup: Database snapshots before migration

3. **Authentication Breaking**
   - Mitigation: Gradual rollout, monitoring
   - Backup: Feature flags for quick rollback

### Medium-Risk Items:

1. **Performance Degradation**

   - Mitigation: Load testing, query optimization
   - Monitoring: Performance metrics tracking

2. **Model Relationship Issues**
   - Mitigation: Integration testing
   - Validation: Data consistency checks

---

## Success Criteria

### Technical Success:

- ✅ All API key operations work via ApiKey model
- ✅ Zero data loss during migration
- ✅ Performance maintained or improved
- ✅ All tests passing
- ✅ Security audit passed

### Business Success:

- ✅ No service disruption
- ✅ All existing functionality preserved
- ✅ API backward compatibility maintained
- ✅ User experience unchanged

---

## Rollback Plan

### If Issues Arise:

1. **Immediate**: Switch traffic back to legacy system
2. **Short-term**: Identify and fix issues
3. **Long-term**: Re-plan migration approach

### Rollback Triggers:

- Authentication failures > 5%
- Performance degradation > 20%
- Data integrity issues detected
- Critical functionality broken

---

## 🚨 CRITICAL UPDATE: User Activities Issue Found

### Problem Discovered

After further audit, a critical issue was found: User services and controllers are referencing `user.activities` array which was **removed** from User model during normalization. This will cause **immediate runtime errors**.

**Affected Code**:

- `server/services/user/userService.js` - Lines 230, 270-278, 391, 447
- `server/controllers/user/userController.js` - getUserActivity endpoint

This requires **IMMEDIATE** attention alongside the API key migration.

---

## Phase 0: EMERGENCY FIX - User Activities (IMMEDIATE)

### 0.1 Fix User Activity Service Methods

**Immediate Fix Required** - These methods will crash the application:

#### File: `server/services/user/userService.js`

```javascript
// BROKEN CODE (will crash):
let activities = user.activities || []; // user.activities is undefined
user.activities.unshift(activity); // TypeError

// TEMP FIX - Query AuditLog model instead:
const AuditLog = require("@models/AuditLog");

const getUserActivity = async (userId, { page = 1, limit = 20, type } = {}) => {
  const skip = (page - 1) * limit;

  let query = { "actor.id": userId };
  if (type) {
    query.action = { $regex: `^${type}\.`, $options: "i" };
  }

  const activities = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await AuditLog.countDocuments(query);

  return {
    data: activities,
    page,
    pages: Math.ceil(total / limit),
    total,
  };
};

const logUserActivity = async (userId, activity) => {
  const auditLog = new AuditLog({
    action: activity.action,
    actor: {
      type: "user",
      id: userId,
      email: activity.userEmail,
      username: activity.username,
    },
    target: activity.target || {},
    context: activity.context || {},
    details: activity.details || {},
  });

  await auditLog.save();
  return auditLog;
};
```

### 0.2 Update Dashboard Stats Method

```javascript
// Fix getDashboardStats method in userService.js
const getDashboardStats = async (userId) => {
  // ...existing code...

  // REPLACE this broken code:
  // const recentActivities = user.activities.filter(...)

  // WITH AuditLog query:
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentActivities = await AuditLog.find({
    "actor.id": userId,
    createdAt: { $gte: last30Days },
  }).lean();

  // Update activity stats calculation accordingly
};
```

**Priority**: IMMEDIATE - Deploy this fix before any other changes.

---

_This implementation plan ensures a systematic, low-risk approach to aligning our backend with the new normalized models while maintaining system stability and performance._
