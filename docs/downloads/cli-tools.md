# Downloads

Get access to Deployio's CLI tools, SDKs, and desktop applications.

## CLI Tools

### Deployio CLI

The official command-line interface for Deployio.

**Latest Version:** v2.1.0

#### Installation Options

**npm (Recommended)**

```bash
npm install -g @deployio/cli
```

**Yarn**

```bash
yarn global add @deployio/cli
```

**Direct Downloads**

- [Windows x64](https://releases.deployio.tech/cli/v2.1.0/deployio-cli-windows-x64.exe)
- [macOS Intel](https://releases.deployio.tech/cli/v2.1.0/deployio-cli-macos-intel.dmg)
- [macOS Apple Silicon](https://releases.deployio.tech/cli/v2.1.0/deployio-cli-macos-arm64.dmg)
- [Linux x64](https://releases.deployio.tech/cli/v2.1.0/deployio-cli-linux-x64.AppImage)

#### Features

- Project creation and management
- Deployment automation
- Real-time logs and monitoring
- Environment management
- CI/CD pipeline configuration

## SDKs

### JavaScript/Node.js SDK

Official SDK for JavaScript and Node.js applications.

```bash
npm install @deployio/sdk
```

**Documentation:** [JavaScript SDK Guide](/support/docs/api/javascript-sdk)

### Python SDK

Official SDK for Python applications.

```bash
pip install deployio-sdk
```

**Documentation:** [Python SDK Guide](/support/docs/api/python-sdk)

### Go SDK

Official SDK for Go applications.

```bash
go get github.com/deployio/go-sdk
```

**Documentation:** [Go SDK Guide](/support/docs/api/go-sdk)

## Desktop Applications

### Deployio Desktop

Full-featured desktop application for managing your deployments.

**Latest Version:** v1.5.2

#### Downloads

- [Windows Installer (.msi)](https://releases.deployio.tech/desktop/v1.5.2/Deployio-Setup-1.5.2.msi)
- [macOS Universal (.dmg)](https://releases.deployio.tech/desktop/v1.5.2/Deployio-1.5.2.dmg)
- [Linux AppImage (.AppImage)](https://releases.deployio.tech/desktop/v1.5.2/Deployio-1.5.2.AppImage)

#### Features

- Visual project management
- Drag-and-drop deployments
- Real-time monitoring dashboard
- Team collaboration tools
- Integrated terminal

## Browser Extensions

### Chrome Extension

Monitor your deployments directly from your browser.

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/deployio/abcdefghijklmn)

### Firefox Extension

Available for Firefox users.

[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/deployio/)

## Docker Images

### Official Docker Images

Pre-built Docker images for common deployment scenarios.

```bash
# Base deployment image
docker pull deployio/deploy:latest

# CI/CD runner
docker pull deployio/ci-runner:latest

# Monitoring agent
docker pull deployio/monitor:latest
```

## Version History

### v2.1.0 (Latest)

- Added support for Kubernetes deployments
- Improved error handling and logging
- New deployment templates
- Performance optimizations

### v2.0.0

- Major UI overhaul
- New API endpoints
- Enhanced security features
- Multi-cloud support

### v1.9.0

- Added Docker Compose support
- Improved CLI performance
- New monitoring features
- Bug fixes and stability improvements

## System Requirements

### CLI Tools

- **Operating System:** Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Memory:** 512MB RAM minimum
- **Storage:** 100MB free space
- **Network:** Internet connection required

### Desktop Application

- **Operating System:** Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Memory:** 2GB RAM minimum, 4GB recommended
- **Storage:** 500MB free space
- **Graphics:** Hardware acceleration recommended

## License

All Deployio tools are available under the [MIT License](https://opensource.org/licenses/MIT) for open-source projects and the [Deployio Commercial License](https://deployio.tech/license) for commercial use.
