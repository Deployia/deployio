import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiZap,
  FiCode,
  FiPackage,
  FiSettings,
  FiDownload,
  FiPlay,
  FiCopy,
  FiLoader,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const GenerationPanel = ({ workspace, aiState }) => {
  const [activeGenerator, setActiveGenerator] = useState("dockerfile");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generators = [
    {
      id: "dockerfile",
      label: "Dockerfile",
      icon: FiPackage,
      description: "Generate optimized Dockerfile",
    },
    {
      id: "docker-compose",
      label: "Docker Compose",
      icon: FiCode,
      description: "Create multi-service composition",
    },
    {
      id: "ci-cd",
      label: "CI/CD Pipeline",
      icon: FiPlay,
      description: "GitHub Actions workflow",
    },
    {
      id: "terraform",
      label: "Terraform",
      icon: FiSettings,
      description: "Infrastructure as Code",
    },
  ];

  const generateContent = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Simulate generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const content = getSampleContent(activeGenerator);
      setGeneratedContent(content);
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Failed to generate configuration. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSampleContent = (type) => {
    const projectName =
      workspace?.activeFile?.split("/").pop()?.split(".")[0] || "app";

    const contents = {
      dockerfile: `# Auto-generated Dockerfile for ${projectName}
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ${projectName} -u 1001

# Set permissions
RUN chown -R ${projectName}:nodejs /app
USER ${projectName}

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]`,

      "docker-compose": `# Docker Compose for ${projectName}
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${projectName}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:`,

      "ci-cd": `# CI/CD Pipeline for ${projectName}
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying ${projectName} to production"
        # Add deployment commands here`,

      terraform: `# Terraform configuration for ${projectName}
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  default     = "us-west-2"
}

resource "aws_vpc" "${projectName}_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${projectName}-vpc"
  }
}

resource "aws_security_group" "${projectName}_sg" {
  name_prefix = "${projectName}-"
  vpc_id      = aws_vpc.${projectName}_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`,
    };

    return contents[type] || contents.dockerfile;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  const downloadFile = () => {
    const fileExtensions = {
      dockerfile: "Dockerfile",
      "docker-compose": "docker-compose.yml",
      "ci-cd": ".github/workflows/ci-cd.yml",
      terraform: "main.tf",
    };

    const filename = fileExtensions[activeGenerator] || "generated-config.txt";
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <FiZap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Code Generation
              </h2>
              <p className="text-xs text-gray-400">
                AI-powered configuration generation
              </p>
            </div>
          </div>
        </div>

        {/* Generator Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {generators.map((generator) => (
            <motion.button
              key={generator.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveGenerator(generator.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeGenerator === generator.id
                  ? "bg-purple-600 text-white"
                  : "bg-neutral-800/50 text-gray-400 hover:text-white hover:bg-neutral-700/50"
              }`}
              title={generator.description}
            >
              <generator.icon className="w-4 h-4" />
              {generator.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="p-4 border-b border-neutral-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateContent}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4" />
                    Generate
                  </>
                )}
              </motion.button>

              {workspace?.activeFile && (
                <div className="text-sm text-gray-400">
                  Context: {workspace.activeFile}
                </div>
              )}
            </div>

            {generatedContent && (
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <FiCopy className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={downloadFile}
                  className="p-2 rounded-lg hover:bg-neutral-800/50 text-gray-400 hover:text-white transition-colors"
                  title="Download file"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Generated Content */}
        <div className="flex-1 p-4">
          {generatedContent ? (
            <div className="h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">
                  Generated Configuration
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiCheck className="w-3 h-3 text-green-400" />
                  Generated successfully
                </div>
              </div>

              <div className="h-full bg-neutral-800/30 rounded-lg border border-neutral-700/50 overflow-hidden">
                <pre className="h-full p-4 text-sm text-gray-300 overflow-auto font-mono">
                  <code>{generatedContent}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <FiZap className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Ready to Generate
                </h3>
                <p className="text-gray-400 mb-4 max-w-md">
                  Select a configuration type and click Generate to create
                  optimized DevOps configurations for your project.
                </p>

                <div className="text-sm text-gray-500">
                  <div className="mb-2">Available generators:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {generators.map((gen) => (
                      <div key={gen.id} className="flex items-center gap-1">
                        <gen.icon className="w-3 h-3" />
                        {gen.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationPanel;
