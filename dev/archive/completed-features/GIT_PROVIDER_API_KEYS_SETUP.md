# Git Provider API Keys Setup Guide

This guide will help you set up OAuth applications for all Git providers in DeployIO's new separated architecture.

## Overview

DeployIO now uses a two-tiered OAuth approach:

1. **Basic Login** - Minimal scopes for account creation (GitHub, Google)
2. **Full Integration** - Comprehensive scopes for repository access (GitHub, GitLab, Azure DevOps)

## Required OAuth Applications

You'll need to create **3 OAuth applications** total:

- 1 GitHub app (handles both basic login + full integration)
- 1 GitLab app (full integration only)
- 1 Azure DevOps app (full integration only)
- Google OAuth is handled by existing configuration

---

## 1. GitHub OAuth Application

### Setup Steps:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:

```
Application name: DeployIO
Homepage URL: http://localhost:5173 (dev) or https://your-domain.com (prod)
Application description: Modern deployment platform with AI-powered insights
Authorization callback URLs:
  - http://localhost:3000/api/v1/users/auth/github/callback (basic login)
  - http://localhost:3000/api/v1/git/connect/github/callback (full integration)
```

4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret**

### Environment Variables:

```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/users/auth/github/callback
```

### Scopes Used:

- **Basic Login**: `user:email` (just email for account creation)
- **Full Integration**: `user:email`, `repo`, `workflow`, `admin:repo_hook`, `read:org`

---

## 2. GitLab OAuth Application

### Setup Steps:

1. Go to [GitLab Applications](https://gitlab.com/-/profile/applications)
2. Click **"New application"**
3. Fill in the application details:

```
Name: DeployIO
Redirect URI: http://localhost:3000/api/v1/git/connect/gitlab/callback
Confidential: ✅ (checked)
Scopes:
  ✅ read_user
  ✅ read_repository
  ✅ api
  ✅ read_api
```

4. Click **"Save application"**
5. Copy the **Application ID** and **Secret**

### Environment Variables:

```bash
GITLAB_CLIENT_ID=your_gitlab_application_id_here
GITLAB_CLIENT_SECRET=your_gitlab_secret_here
GITLAB_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/gitlab/callback
```

### Scopes Used:

- **Full Integration Only**: `read_user`, `read_repository`, `api`, `read_api`

---

## 3. Azure DevOps OAuth Application

### Setup Steps:

1. Go to [Azure DevOps](https://dev.azure.com)
2. Navigate to **Organization Settings** → **OAuth configurations**
3. Click **"New OAuth configuration"**
4. Fill in the application details:

```
Company name: DeployIO
Application name: DeployIO Integration
Application website: http://localhost:5173 (dev) or https://your-domain.com (prod)
Authorization callback URL: http://localhost:3000/api/v1/git/connect/azuredevops/callback
Authorized scopes:
  ✅ Code (read)
  ✅ Code (read & write)
  ✅ Identity (read)
  ✅ Project and team (read)
  ✅ Build (read & execute)
```

5. Click **"Create"**
6. Copy the **App ID** and **Client Secret**

### Environment Variables:

```bash
AZURE_DEVOPS_CLIENT_ID=your_azure_app_id_here
AZURE_DEVOPS_CLIENT_SECRET=your_azure_client_secret_here
AZURE_DEVOPS_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/azuredevops/callback
```

### Scopes Used:

- **Full Integration Only**: `vso.code`, `vso.identity`, `vso.project`, `vso.build`

---

## 4. Google OAuth (Already Configured)

Your existing Google OAuth configuration is used for basic login only:

### Environment Variables:

```bash
GOOGLE_CLIENT_ID=your_existing_google_client_id
GOOGLE_CLIENT_SECRET=your_existing_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/users/auth/google/callback
```

### Scopes Used:

- **Basic Login Only**: `profile`, `email`

---

## Complete .env Configuration

After setting up all OAuth applications, your `.env` file should include:

```bash
# MongoDB Connection String
MONGODB_URI=mongodb://mongodb:27017/deployio

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# Application Environment
NODE_ENV=development
PORT=3000

# Frontend URLs
FRONTEND_URL_DEV=http://localhost:5173
FRONTEND_URL_PROD=https://your-domain.com

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_FROM=your_email@gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000

# OAuth Configurations

# Google OAuth (Basic Login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/users/auth/google/callback

# GitHub OAuth (Basic Login + Full Integration)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/users/auth/github/callback

# GitLab OAuth (Full Integration)
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret
GITLAB_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/gitlab/callback

# Azure DevOps OAuth (Full Integration)
AZURE_DEVOPS_CLIENT_ID=your_azure_devops_client_id
AZURE_DEVOPS_CLIENT_SECRET=your_azure_devops_client_secret
AZURE_DEVOPS_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/azuredevops/callback

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

---

## Testing Your Configuration

After setting up all OAuth applications:

1. **Install dependencies**:

   ```bash
   cd server
   npm install passport-gitlab2 passport-oauth2 axios
   ```

2. **Start the server**:

   ```bash
   npm run dev
   ```

3. **Test basic authentication**:

   - Visit: `http://localhost:3000/api/v1/users/auth/github`
   - Should redirect to GitHub with minimal scope
   - After authorization, should create account

4. **Test Git provider integration**:
   - Visit: `http://localhost:3000/api/v1/git/connect/providers`
   - Should return available providers
   - Visit: `http://localhost:3000/api/v1/git/connect/github`
   - Should redirect to GitHub with full repo access

---

## Production Configuration

For production deployment:

1. **Update callback URLs** in all OAuth applications:

   ```
   GitHub: https://your-domain.com/api/v1/users/auth/github/callback
           https://your-domain.com/api/v1/git/connect/github/callback
   GitLab: https://your-domain.com/api/v1/git/connect/gitlab/callback
   Azure:  https://your-domain.com/api/v1/git/connect/azuredevops/callback
   ```

2. **Update environment variables**:

   ```bash
   NODE_ENV=production
   FRONTEND_URL_PROD=https://your-domain.com
   # Update all callback URLs to production domain
   ```

3. **Enable SSL** and ensure HTTPS is used for all OAuth callbacks

---

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**

   - Ensure callback URLs in OAuth apps match environment variables exactly
   - Check for trailing slashes or protocol mismatches

2. **"Insufficient scope"**

   - Verify scopes are correctly configured in OAuth applications
   - Check that provider strategies request appropriate scopes

3. **"Provider not supported"**

   - Ensure provider is included in `ProviderFactory.getSupportedProviders()`
   - Verify strategy is properly configured in `passport.js`

4. **Token refresh failures**
   - Check refresh token implementation in provider classes
   - Verify refresh_token is stored correctly in database

### Debug Mode:

Enable debug logging by setting:

```bash
DEBUG_RATE_LIMIT=true
NODE_ENV=development
```

This will show detailed OAuth flow information in server logs.

---

## Next Steps

After completing OAuth setup:

1. **Frontend Implementation**: Build the repository browser UI
2. **AI Integration**: Connect repository analysis with AI service
3. **Deployment Pipeline**: Integrate with deployment automation
4. **Testing**: Comprehensive integration testing with all providers

Your Git provider integration is now ready for production use! 🚀
