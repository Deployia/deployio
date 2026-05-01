#!/bin/bash

#####################################################################
# Automated Example Repo Deployment Script
# Deploys all 4 examples to deployio-tech organization on GitHub
#####################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_ORG="deployio-tech"
EXAMPLES=(
  "deployio-movie-crud:Movie CRUD Application - Full Stack MERN"
  "deployio-weather-bookmark:Weather API + Bookmarking - FastAPI + HTML"
  "deployio-todo-realtime:Real-time Todo App - Next.js Full Stack"
  "deployio-snake-game:Classic Snake Game - FastAPI + React"
)

# Function to print colored output
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️ $1${NC}"
}

# Step 1: Check prerequisites
print_header "STEP 1: Checking Prerequisites"

if ! command -v gh &> /dev/null; then
  print_error "GitHub CLI (gh) not found. Please install it:"
  echo "  brew install gh"
  exit 1
fi

if ! command -v git &> /dev/null; then
  print_error "Git not found. Please install it."
  exit 1
fi

print_success "GitHub CLI found"
print_success "Git found"

# Step 2: Check GitHub authentication
print_header "STEP 2: Checking GitHub Authentication"

if ! gh auth status &> /dev/null; then
  print_error "Not authenticated with GitHub"
  echo "Please run: gh auth login"
  exit 1
fi

GH_USER=$(gh api user --jq '.login')
print_success "Authenticated as: $GH_USER"

# Step 3: Verify organization exists
print_header "STEP 3: Verifying Organization"

if ! gh org view "$GITHUB_ORG" &> /dev/null 2>&1; then
  print_error "Organization '$GITHUB_ORG' not found or you don't have access"
  echo "Available options:"
  echo "  1. Create the organization: https://github.com/organizations/new"
  echo "  2. Use your personal account instead"
  read -p "Continue with your personal account? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  GITHUB_ORG=$GH_USER
  print_info "Using personal account: $GITHUB_ORG"
fi

print_success "Organization verified: $GITHUB_ORG"

# Step 4: Deploy each example
print_header "STEP 4: Deploying Examples"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
EXAMPLES_DIR="$PROJECT_ROOT/examples"

for example_info in "${EXAMPLES[@]}"; do
  IFS=':' read -r REPO_NAME REPO_DESC <<< "$example_info"
  
  echo ""
  print_info "Processing: $REPO_NAME"
  
  REPO_PATH="$EXAMPLES_DIR/$REPO_NAME"
  
  # Check if directory exists
  if [ ! -d "$REPO_PATH" ]; then
    print_error "Directory not found: $REPO_PATH"
    continue
  fi
  
  cd "$REPO_PATH"
  
  # Initialize git if needed
  if [ ! -d "$REPO_PATH/.git" ]; then
    print_info "Initializing git repository"
    git init
    git config user.name "$GH_USER"
    git config user.email "$(gh api user --jq '.email // "user@example.com"')"
    
    # Add and commit
    print_info "Creating initial commit"
    git add -A
    git commit -m "Initial commit: $REPO_NAME" || true
  fi
  
  # Check if repo already exists on GitHub
  if gh repo view "$GITHUB_ORG/$REPO_NAME" &> /dev/null 2>&1; then
    print_warning "Repository already exists: $GITHUB_ORG/$REPO_NAME"
    read -p "  Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      continue
    fi
    print_info "Deleting existing repository for overwrite"
    gh repo delete "$GITHUB_ORG/$REPO_NAME" --yes || true
    sleep 2
  fi
  
  # Create repository on GitHub
  print_info "Creating repository on GitHub: $REPO_NAME"
  gh repo create "$GITHUB_ORG/$REPO_NAME" \
    --description "$REPO_DESC" \
    --public \
    --disable-wiki \
    --disable-issues \
    --source="$REPO_PATH" \
    --remote=origin \
    --push || {
    print_error "Failed to create repository: $REPO_NAME"
    continue
  }
  
  print_success "Repository created and pushed: $REPO_NAME"
  DEPLOYED_REPOS+=("$REPO_NAME")
done

# Step 5: Summary
print_header "DEPLOYMENT SUMMARY"

echo -e "\n${GREEN}Successfully deployed ${#DEPLOYED_REPOS[@]} repositories:${NC}"
for repo in "${DEPLOYED_REPOS[@]}"; do
  echo -e "  ${GREEN}✓${NC} https://github.com/$GITHUB_ORG/$repo"
done

echo -e "\n${BLUE}Next steps:${NC}"
echo "  1. Visit the repositories above to verify"
echo "  2. Update repository settings if needed"
echo "  3. Share with your team!"

print_success "All done! 🎉"
