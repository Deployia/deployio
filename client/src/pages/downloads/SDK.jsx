import React from "react";
import {
  FaCode,
  FaBook,
  FaUsers,
  FaRocket,
  FaBolt,
  FaChartLine,
  FaPython,
  FaNodeJs,
} from "react-icons/fa";
import { SiGo } from "react-icons/si";
import SEO from "../../components/SEO";
import DownloadHero from "../../components/downloads/DownloadHero";
import DownloadStats from "../../components/downloads/DownloadStats";
import DownloadCTA from "../../components/downloads/DownloadCTA";
import TabbedCodeExamples from "../../components/downloads/TabbedCodeExamples";

const SDK = () => {
  // Concise, focused examples
  const examples = [
    {
      id: "quickstart",
      title: "🚀 Quick Start",
      tabs: [
        {
          id: "javascript",
          name: "JavaScript",
          icon: FaNodeJs,
          color: "text-yellow-400",
          install: "npm install @deployio/sdk",
          code: `import { DeployioSDK } from '@deployio/sdk';

const deployio = new DeployioSDK({
  apiKey: process.env.DEPLOYIO_API_KEY
});

// Deploy with AI optimization
const result = await deployio.deploy({
  project: './my-app',
  environment: 'production',
  aiOptimize: true
});

console.log('Deploy URL:', result.url);`,
        },
        {
          id: "python",
          name: "Python",
          icon: FaPython,
          color: "text-blue-400",
          install: "pip install deployio-sdk",
          code: `from deployio import DeployioSDK

deployio = DeployioSDK(
    api_key=os.getenv('DEPLOYIO_API_KEY')
)

# Deploy with AI analysis
result = deployio.deploy(
    project_path='./my-app',
    environment='production',
    ai_optimize=True
)

print(f"Deploy URL: {result.url}")`,
        },
        {
          id: "go",
          name: "Go",
          icon: SiGo,
          color: "text-cyan-400",
          install: "go get github.com/deployio/sdk-go",
          code: `package main

import (
    "github.com/deployio/sdk-go"
    "log"
)

func main() {
    client := deployio.NewClient(
        os.Getenv("DEPLOYIO_API_KEY"),
    )
    
    result, err := client.Deploy(&deployio.DeployRequest{
        ProjectPath: "./my-app",
        Environment: "production",
        AIOptimize:  true,
    })
    
    log.Printf("Deploy URL: %s", result.URL)
}`,
        },
      ],
    },
    {
      id: "monitoring",
      title: "📊 AI Monitoring",
      tabs: [
        {
          id: "javascript",
          name: "JavaScript",
          icon: FaNodeJs,
          color: "text-yellow-400",
          code: `// Real-time AI monitoring
const monitor = deployio.createMonitor({
  deployment: 'my-app-prod',
  aiInsights: true,
  alerts: ['performance', 'errors', 'scaling']
});

monitor.on('insight', (insight) => {
  console.log('AI Recommendation:', insight.message);
  if (insight.autoFix) {
    monitor.applyFix(insight.fixId);
  }
});`,
        },
        {
          id: "python",
          name: "Python",
          icon: FaPython,
          color: "text-blue-400",
          code: `# AI-powered performance monitoring
monitor = deployio.create_monitor(
    deployment='my-app-prod',
    ai_insights=True,
    alerts=['performance', 'errors', 'scaling']
)

@monitor.on_insight
def handle_insight(insight):
    print(f"AI Recommendation: {insight.message}")
    if insight.auto_fix:
        monitor.apply_fix(insight.fix_id)`,
        },
      ],
    },
    {
      id: "scaling",
      title: "⚡ Auto Scaling",
      tabs: [
        {
          id: "javascript",
          name: "JavaScript",
          icon: FaNodeJs,
          color: "text-yellow-400",
          code: `// AI-driven auto scaling
await deployio.configureScaling({
  deployment: 'my-app-prod',
  aiPredictive: true,
  rules: {
    cpu: { threshold: 70, action: 'scale_up' },
    memory: { threshold: 80, action: 'scale_up' },
    requests: { threshold: 1000, action: 'scale_out' }
  }
});

// Get scaling predictions
const prediction = await deployio.getScalingPrediction();
console.log('Expected load:', prediction.forecast);`,
        },
        {
          id: "python",
          name: "Python",
          icon: FaPython,
          color: "text-blue-400",
          code: `# Configure AI-driven scaling
deployio.configure_scaling(
    deployment='my-app-prod',
    ai_predictive=True,
    rules={
        'cpu': {'threshold': 70, 'action': 'scale_up'},
        'memory': {'threshold': 80, 'action': 'scale_up'},
        'requests': {'threshold': 1000, 'action': 'scale_out'}
    }
)

# AI load forecasting
prediction = deployio.get_scaling_prediction()
print(f"Expected load: {prediction.forecast}")`,
        },
      ],
    },
  ];

  // Updated, more impressive stats
  const stats = [
    { label: "API Calls/Month", value: "50M+", icon: FaRocket },
    { label: "Languages", value: "5", icon: FaCode },
    { label: "Developers", value: "15K+", icon: FaUsers },
    { label: "Uptime", value: "99.99%", icon: FaChartLine },
  ];
  const heroProps = {
    badge: {
      icon: FaCode,
      text: "AI-Powered Developer SDKs",
    },
    comingSoonBadge: {
      text: "Coming Q2 2026",
      highlight: true,
    },
    title: "Deployio SDKs",
    subtitle: "Build Intelligent Deployments",
    description:
      "Integrate AI-powered deployment automation directly into your applications. Our SDKs provide intelligent deployment orchestration, predictive scaling, and automated optimization across multiple programming languages.",
    version: "v3.2.1",
    primaryCTA: {
      text: "Join Waitlist",
      icon: FaBolt,
      onClick: () =>
        window.open("https://forms.gle/deployio-sdk-waitlist", "_blank"),
    },
    secondaryCTA: {
      text: "Documentation",
      icon: FaBook,
      onClick: () => window.open("/docs/sdk", "_blank"),
    },
    gradient: "from-purple-400 via-blue-400 to-indigo-400",
    downloadStats: [
      { label: "Expected Q2 2026", value: "Q2" },
      { label: "Waitlist Members", value: "3.2K+" },
      { label: "Success Rate", value: "99.8%" },
    ],
    visual: (
      <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-sm">main.js</div>
        </div>
        <div className="font-mono text-sm space-y-1">
          {" "}
          <div className="text-purple-400">
            import &#123; DeployioSDK &#125; from &apos;@deployio/sdk&apos;;
          </div>
          <div className="text-gray-500">
            {/* AI-powered deployment automation */}
          </div>
          <div className="text-blue-400">
            const deployio = new DeployioSDK();
          </div>{" "}
          <div className="text-gray-400">
            <span className="text-yellow-400">const result</span> =
            <span className="text-green-400"> await</span> deployio.deploy({"{"}
          </div>
          <div className="text-gray-400 ml-4">
            project:{" "}
            <span className="text-orange-400">&apos;./my-app&apos;</span>,
          </div>
          <div className="text-gray-400 ml-4">
            aiOptimize: <span className="text-cyan-400">true</span>
          </div>
          <div className="text-gray-400">{"}"});</div>
          <div className="text-indigo-400 animate-pulse">_</div>
        </div>
      </div>
    ),
  };
  const statsProps = {
    title: "SDK Impact",
    stats,
    gradient: "from-purple-400 via-blue-400 to-indigo-400",
  };

  const ctaProps = {
    title: "Ready to Build with AI?",
    subtitle:
      "Join thousands of developers building the future of deployment automation with intelligent SDKs.",
    primaryText: "Join Waitlist",
    secondaryText: "View Documentation",
    onPrimary: () =>
      window.open("https://forms.gle/deployio-sdk-waitlist", "_blank"),
    onSecondary: () => window.open("/docs/sdk", "_blank"),
    gradient: "from-purple-400 via-blue-400 to-indigo-400",
  };

  return (
    <>
      <SEO
        title="Deployio SDK - AI-Powered Deployment SDKs for Developers"
        description="Integrate AI-powered deployment capabilities into your applications with Deployio SDKs. Available for JavaScript, Python, Java, and Go with comprehensive documentation."
        keywords="SDK, deployment SDK, AI SDK, developer tools, deployment automation, JavaScript SDK, Python SDK"
      />

      <div className="min-h-screen">
        <DownloadHero {...heroProps} />

        <TabbedCodeExamples
          title="Code Examples"
          subtitle="Explore powerful deployment automation across languages"
          examples={examples}
          gradient="from-purple-400 via-blue-400 to-indigo-400"
        />

        <DownloadStats {...statsProps} />

        <DownloadCTA {...ctaProps} />
      </div>
    </>
  );
};

export default SDK;
