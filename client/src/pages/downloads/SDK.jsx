import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCode,
  FaNodeJs,
  FaPython,
  FaJava,
  FaPhp,
  FaRust,
  FaCopy,
  FaCheck,
  FaBook,
  FaGithub,
  FaRocket,
  FaShieldAlt,
  FaCog,
  FaChartLine,
} from "react-icons/fa";
import { SiGo, SiRuby, SiDotnet } from "react-icons/si";
import SEO from "@components/SEO";

const SDKDownload = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [copiedCode, setCopiedCode] = useState("");

  const sdks = {
    javascript: {
      icon: FaNodeJs,
      color: "text-green-500",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      name: "JavaScript/Node.js",
      version: "v3.2.1",
      description: "Full-featured SDK for Node.js and browser environments",
      install: "npm install @deployio/sdk",
      importCode: `import { DeployioClient } from '@deployio/sdk';

const client = new DeployioClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Deploy an application
const deployment = await client.deploy({
  projectId: 'your-project-id',
  branch: 'main',
  environment: 'production'
});

console.log('Deployment ID:', deployment.id);`,
      features: [
        "TypeScript Support",
        "Promise-based API",
        "Real-time WebSocket events",
        "Browser & Node.js",
      ],
      docs: "/docs/sdk/javascript",
      github: "https://github.com/deployio/deployio-js-sdk",
    },
    python: {
      icon: FaPython,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      name: "Python",
      version: "v2.1.4",
      description: "Pythonic SDK with async/await support",
      install: "pip install deployio-sdk",
      importCode: `from deployio import DeployioClient
import asyncio

client = DeployioClient(
    api_key="your-api-key",
    environment="production"
)

async def deploy_app():
    deployment = await client.deploy(
        project_id="your-project-id",
        branch="main",
        environment="production"
    )
    print(f"Deployment ID: {deployment.id}")

asyncio.run(deploy_app())`,
      features: [
        "Async/Await Support",
        "Type Hints",
        "Django Integration",
        "FastAPI Plugin",
      ],
      docs: "/docs/sdk/python",
      github: "https://github.com/deployio/deployio-python-sdk",
    },
    java: {
      icon: FaJava,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      name: "Java",
      version: "v1.8.2",
      description: "Enterprise-ready Java SDK with Spring Boot integration",
      install: "implementation 'com.deployio:deployio-sdk:1.8.2'",
      importCode: `import com.deployio.DeployioClient;
import com.deployio.models.Deployment;

DeployioClient client = DeployioClient.builder()
    .apiKey("your-api-key")
    .environment("production")
    .build();

// Deploy an application
Deployment deployment = client.deploy(
    DeployRequest.builder()
        .projectId("your-project-id")
        .branch("main")
        .environment("production")
        .build()
);

System.out.println("Deployment ID: " + deployment.getId());`,
      features: [
        "Spring Boot Starter",
        "Reactive Support",
        "Maven & Gradle",
        "Enterprise Features",
      ],
      docs: "/docs/sdk/java",
      github: "https://github.com/deployio/deployio-java-sdk",
    },
    go: {
      icon: SiGo,
      color: "text-cyan-500",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
      name: "Go",
      version: "v1.5.3",
      description: "High-performance Go SDK with context support",
      install: "go get github.com/deployio/deployio-go-sdk",
      importCode: `package main

import (
    "context"
    "fmt"
    "github.com/deployio/deployio-go-sdk"
)

func main() {
    client := deployio.NewClient("your-api-key")
    
    deployment, err := client.Deploy(context.Background(), &deployio.DeployRequest{
        ProjectID:   "your-project-id",
        Branch:      "main",
        Environment: "production",
    })
    
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Deployment ID: %s\\n", deployment.ID)
}`,
      features: [
        "Context Support",
        "Goroutine Safe",
        "Minimal Dependencies",
        "High Performance",
      ],
      docs: "/docs/sdk/go",
      github: "https://github.com/deployio/deployio-go-sdk",
    },
    php: {
      icon: FaPhp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      name: "PHP",
      version: "v2.3.1",
      description: "Modern PHP SDK with Laravel and Symfony support",
      install: "composer require deployio/deployio-sdk",
      importCode: `<?php
require_once 'vendor/autoload.php';

use Deployio\\DeployioClient;

$client = new DeployioClient([
    'api_key' => 'your-api-key',
    'environment' => 'production'
]);

$deployment = $client->deploy([
    'project_id' => 'your-project-id',
    'branch' => 'main',
    'environment' => 'production'
]);

echo "Deployment ID: " . $deployment->getId();`,
      features: [
        "Laravel Package",
        "Symfony Bundle",
        "PSR-4 Compatible",
        "Modern PHP 8+",
      ],
      docs: "/docs/sdk/php",
      github: "https://github.com/deployio/deployio-php-sdk",
    },
    ruby: {
      icon: SiRuby,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      name: "Ruby",
      version: "v1.9.0",
      description: "Ruby SDK with Rails integration and ActiveRecord support",
      install: "gem install deployio-sdk",
      importCode: `require 'deployio'

client = Deployio::Client.new(
  api_key: 'your-api-key',
  environment: 'production'
)

deployment = client.deploy(
  project_id: 'your-project-id',
  branch: 'main',
  environment: 'production'
)

puts "Deployment ID: #{deployment.id}"`,
      features: [
        "Rails Integration",
        "ActiveRecord Models",
        "RSpec Helpers",
        "Sidekiq Support",
      ],
      docs: "/docs/sdk/ruby",
      github: "https://github.com/deployio/deployio-ruby-sdk",
    },
    csharp: {
      icon: SiDotnet,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      name: "C# / .NET",
      version: "v2.0.1",
      description: ".NET SDK with async/await and dependency injection",
      install: "dotnet add package Deployio.SDK",
      importCode: `using Deployio;

var client = new DeployioClient(new DeployioOptions
{
    ApiKey = "your-api-key",
    Environment = "production"
});

var deployment = await client.DeployAsync(new DeployRequest
{
    ProjectId = "your-project-id",
    Branch = "main",
    Environment = "production"
});

Console.WriteLine($"Deployment ID: {deployment.Id}");`,
      features: [
        "Dependency Injection",
        "ASP.NET Core",
        "Entity Framework",
        "NuGet Package",
      ],
      docs: "/docs/sdk/csharp",
      github: "https://github.com/deployio/deployio-dotnet-sdk",
    },
    rust: {
      icon: FaRust,
      color: "text-orange-500",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      name: "Rust",
      version: "v0.8.1",
      description: "Memory-safe Rust SDK with tokio async runtime",
      install: 'deployio-sdk = "0.8.1"',
      importCode: `use deployio::{DeployioClient, DeployRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = DeployioClient::new("your-api-key");
    
    let deployment = client.deploy(DeployRequest {
        project_id: "your-project-id".to_string(),
        branch: "main".to_string(),
        environment: "production".to_string(),
    }).await?;
    
    println!("Deployment ID: {}", deployment.id);
    Ok(())
}`,
      features: [
        "Memory Safe",
        "Tokio Async",
        "Serde Integration",
        "Zero-cost Abstractions",
      ],
      docs: "/docs/sdk/rust",
      github: "https://github.com/deployio/deployio-rust-sdk",
    },
  };

  const features = [
    {
      icon: FaRocket,
      title: "Easy Integration",
      description: "Get up and running in minutes with simple APIs",
    },
    {
      icon: FaShieldAlt,
      title: "Type Safety",
      description: "Full type definitions and compile-time safety",
    },
    {
      icon: FaCog,
      title: "Configurable",
      description: "Extensive configuration options for all use cases",
    },
    {
      icon: FaChartLine,
      title: "Real-time Events",
      description: "Subscribe to deployment events and status updates",
    },
  ];

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const currentSDK = sdks[selectedLanguage];

  return (
    <>
      <SEO
        title="Download SDK - Deployio Software Development Kits"
        description="Download official Deployio SDKs for JavaScript, Python, Java, Go, PHP, Ruby, C#, and Rust. Integrate deployment automation into your applications."
        keywords="SDK download, API client, JavaScript SDK, Python SDK, Java SDK, Go SDK, deployment integration"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                <FaCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Deployio SDKs
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Integrate Deployio into your applications with our official
                SDKs. Available for all major programming languages.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Language Selection */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Choose Your Language
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {Object.entries(sdks).map(([key, sdk]) => {
                  const Icon = sdk.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedLanguage(key)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl font-medium transition-all ${
                        selectedLanguage === key
                          ? "bg-blue-500 text-white shadow-lg transform scale-105"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 ${
                          selectedLanguage === key ? "text-white" : sdk.color
                        }`}
                      />
                      <span className="text-sm text-center leading-tight">
                        {sdk.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Selected SDK Details */}
            <motion.div
              key={selectedLanguage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* SDK Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${currentSDK.bgColor}`}>
                    <currentSDK.icon
                      className={`w-8 h-8 ${currentSDK.color}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentSDK.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentSDK.version} • Latest Release
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {currentSDK.description}
                </p>

                {/* Installation */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Installation
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(currentSDK.install, "install")
                      }
                      className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {copiedCode === "install" ? (
                        <>
                          <FaCheck className="w-3 h-3 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <FaCopy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                    {currentSDK.install}
                  </code>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Features
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentSDK.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <FaCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-3">
                  <a
                    href={currentSDK.docs}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FaBook className="w-4 h-4" />
                    Documentation
                  </a>
                  <a
                    href={currentSDK.github}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <FaGithub className="w-4 h-4" />
                    GitHub
                  </a>
                </div>
              </div>

              {/* Code Example */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Quick Start Example
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(currentSDK.importCode, "code")
                    }
                    className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {copiedCode === "code" ? (
                      <>
                        <FaCheck className="w-3 h-3 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <FaCopy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-gray-800 dark:text-gray-200 font-mono whitespace-pre">
                    {currentSDK.importCode}
                  </code>
                </pre>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Common Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                All our SDKs share these powerful features
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white"
            >
              <FaCode className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Building Today
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Get started with our comprehensive SDKs and build powerful
                deployment automation into your applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  View All Documentation
                </button>
                <button className="flex items-center justify-center gap-2 px-8 py-4 border border-blue-300 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  <FaGithub className="w-4 h-4" />
                  Explore on GitHub
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SDKDownload;
