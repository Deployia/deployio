# OAuth Setup Guide for DeployIO

## GitHub OAuth App Configuration

### Step 1: GitHub OAuth App Settings

Go to your GitHub OAuth app settings at: https://github.com/settings/developers

For your existing app with Client ID `Ov23liDqQJAMCZhoBguB`, update these settings:

**Application name:** DeployIO Integration
**Homepage URL:** http://localhost:5173
**Authorization callback URL:** `http://localhost:3000/api/v1/git/connect/github/callback`

### Step 2: Environment Variables (Already Set)

Your `.env` file already has:

```dotenv
GITHUB_CLIENT_ID=Ov23liDqQJAMCZhoBguB
GITHUB_CLIENT_SECRET=3f3ea59b5d642c9b2428eeb444d3a588cd5ffe4d
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/users/auth/github/callback
```

**Action Required:** Update your GitHub OAuth app's callback URL to match the integration endpoint:

- Old URL: `http://localhost:3000/api/v1/users/auth/github/callback` (for basic login)
- New URL: `http://localhost:3000/api/v1/git/connect/github/callback` (for git integration)

### Step 3: Production URLs

For production, update to:

- Homepage URL: `https://deployio.tech`
- Authorization callback URL: `https://api.deployio.tech/api/v1/git/connect/github/callback`

## GitLab OAuth App Configuration

### Step 1: Create GitLab OAuth Application

1. Go to GitLab.com
2. Navigate to User Settings > Applications
3. Create a new application with these settings:

**Name:** DeployIO Integration
**Redirect URI:** `http://localhost:3000/api/v1/git/connect/gitlab/callback`
**Scopes:**

- `read_user`
- `read_repository`
- `api`
- `read_api`

### Step 2: Add GitLab Environment Variables

Add these to your `.env` file:

```dotenv
# GitLab OAuth (Full Integration)
GITLAB_CLIENT_ID=your_gitlab_application_id_here
GITLAB_CLIENT_SECRET=your_gitlab_secret_here
GITLAB_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/gitlab/callback
```

### Step 3: Production GitLab URLs

For production:

- Redirect URI: `https://api.deployio.tech/api/v1/git/connect/gitlab/callback`

## Azure DevOps OAuth (Future)

### Step 1: Azure DevOps App Registration

1. Go to Azure DevOps organization settings
2. Navigate to Extensions > Azure AD Applications
3. Create new application registration

**Redirect URI:** `http://localhost:3000/api/v1/git/connect/azuredevops/callback`
**Scopes:**

- `vso.code` (Code read and write)
- `vso.project` (Project and team read)
- `vso.build_execute` (Build execution)

### Step 2: Azure Environment Variables

```dotenv
# Azure DevOps OAuth (Full Integration)
AZURE_DEVOPS_CLIENT_ID=your_azure_app_id
AZURE_DEVOPS_CLIENT_SECRET=your_azure_secret
AZURE_DEVOPS_CALLBACK_URL=http://localhost:3000/api/v1/git/connect/azuredevops/callback
```

## Testing OAuth Flow

### GitHub Integration Test

1. Navigate to: http://localhost:5173/dashboard/integrations
2. Click "Connect" on GitHub card
3. Should redirect to: `http://localhost:3000/api/v1/git/connect/github`
4. GitHub OAuth should redirect to: `http://localhost:3000/api/v1/git/connect/github/callback`
5. Backend should process and redirect back to frontend with success/error status

### Debug Steps

1. Check browser network tab for redirect URLs
2. Verify environment variables are loaded: `console.log(process.env.GITHUB_CLIENT_ID)` in backend
3. Check backend logs for OAuth strategy errors
4. Verify BASE_URL is set correctly

## Current Status

✅ GitHub OAuth app exists (Client ID: Ov23liDqQJAMCZhoBguB)
❌ Callback URL needs to be updated in GitHub settings
❌ GitLab OAuth app needs to be created
❌ GitLab credentials need to be added to .env
⚠️ Fixed redirect URL issue in frontend API configuration

## Next Steps

1. **IMMEDIATE:** Update GitHub OAuth app callback URL in GitHub settings
2. Create GitLab OAuth app and add credentials
3. Test GitHub integration flow
4. Test GitLab integration flow
5. Add error handling for failed OAuth flows
