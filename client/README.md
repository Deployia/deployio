# Deployio Playground

A modern, VSCode-like interface for showcasing DevOps best practices and tools. Features an integrated AI assistant (DeployBot) powered by Groq's LLM API.

## 🚀 Features

- **VSCode-like Layout**: Familiar three-panel design with file explorer, editor, and terminal
- **GitHub Integration**: Browse and view files from any public GitHub repository
- **AI-Powered Assistant**: DeployBot provides intelligent DevOps guidance and best practices
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion animations
- **DevOps Focused**: Specialized content for containers, CI/CD, Kubernetes, and infrastructure

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub Personal Access Token (for repository access)
- Groq API Key (for AI responses)

### Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Configure your API keys in `.env`:**

   ```env
   VITE_GITHUB_TOKEN=your_github_token_here
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🔑 API Keys Setup

### GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` permissions
3. Add to `.env` as `VITE_GITHUB_TOKEN`

### Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Create an account and generate an API key
3. Add to `.env` as `VITE_GROQ_API_KEY`

## 🤖 AI Assistant (DeployBot)

DeployBot provides intelligent responses about:

- Docker containerization and optimization
- CI/CD pipeline design and best practices
- Kubernetes deployment strategies
- Infrastructure as Code (Terraform)
- DevOps security and monitoring

The assistant automatically falls back to curated responses if the Groq API is unavailable.

## 🏗️ Architecture

```
src/
├── components/
│   └── playground/
│       ├── PlaygroundLayout.jsx    # Main layout container
│       ├── FileExplorer.jsx        # GitHub repository browser
│       ├── CodeEditor.jsx          # File content viewer
│       ├── Terminal.jsx             # Git Bash-style terminal
│       └── ChatbotPanel.jsx        # DeployBot AI assistant
├── services/
│   ├── githubService.js            # GitHub API integration
│   └── llmService.js               # Groq LLM integration
└── utils/
    └── markdownRenderer.js         # Enhanced markdown parsing
```

## 🔧 Development

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons (Feather Icons)
- **API Integration**: GitHub API v4, Groq API

## 📦 Build

```bash
npm run build
```

## 🚀 Production Deployment

The app is designed to work in containerized environments. See the Dockerfile in the root directory for deployment configuration.

---

Built with ❤️ for the DevOps community
