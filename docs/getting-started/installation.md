# Installation Guide

This guide covers all the ways you can install and set up Deployio tools and services.

## Web Dashboard

No installation required! Simply visit [deployio.tech](https://deployio.tech) and sign up for an account.

## CLI Installation

### Using npm (Recommended)

```bash
npm install -g @deployio/cli
```

### Using yarn

```bash
yarn global add @deployio/cli
```

### Using curl (Linux/macOS)

```bash
curl -sSL https://install.deployio.tech | bash
```

### Using PowerShell (Windows)

```powershell
iwr https://install.deployio.tech/windows | iex
```

## Docker Image

```bash
docker pull deployio/cli:latest
docker run -it deployio/cli:latest deployio --help
```

## Verify Installation

```bash
deployio --version
deployio auth login
```

## IDE Extensions

### VS Code Extension

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Deployio"
4. Click Install

### JetBrains Plugin

Available for IntelliJ IDEA, WebStorm, and other JetBrains IDEs:

1. Go to File → Settings → Plugins
2. Search for "Deployio"
3. Install and restart

## Browser Extension

Install our browser extension for quick deployments:

- [Chrome Web Store](https://chrome.google.com/webstore)
- [Firefox Add-ons](https://addons.mozilla.org)

## System Requirements

### Minimum Requirements

- Node.js 16+ (for CLI)
- 4GB RAM
- 1GB free disk space

### Recommended

- Node.js 18+
- 8GB RAM
- 5GB free disk space

## Troubleshooting

### CLI Not Found

If you get "command not found" error:

```bash
# Check if npm global bin is in PATH
npm config get prefix

# Add to your shell profile
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission Issues

On Linux/macOS, you might need to fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Next Steps

- [Authentication Setup](./authentication.md)
- [Quick Start Guide](./quick-start.md)
- [First Deployment](./first-deployment.md)
