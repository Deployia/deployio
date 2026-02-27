import { useEffect, useState } from "react";

const features = [
  {
    icon: "🚀",
    title: "One-Click Deploy",
    desc: "Push your code and watch it go live in seconds. No DevOps expertise required.",
  },
  {
    icon: "🔍",
    title: "AI-Powered Analysis",
    desc: "Automatic stack detection, Dockerfile generation, and deployment optimization.",
  },
  {
    icon: "🌐",
    title: "Global Edge Network",
    desc: "Deploy to the edge with automatic SSL, CDN, and wildcard subdomain routing.",
  },
  {
    icon: "📊",
    title: "Real-Time Monitoring",
    desc: "Live metrics, log streaming, and health checks for every deployment.",
  },
  {
    icon: "🔒",
    title: "Enterprise Security",
    desc: "JWT authentication, role-based access, and encrypted secrets management.",
  },
  {
    icon: "⚡",
    title: "Multi-Stack Support",
    desc: "Deploy MERN, Next.js, FastAPI, Django, and more — all from one platform.",
  },
];

const stats = [
  { label: "Deployments", value: "10K+" },
  { label: "Uptime", value: "99.9%" },
  { label: "Avg Deploy Time", value: "<30s" },
  { label: "Stacks Supported", value: "12+" },
];

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Nav */}
      <nav className="border-b border-neutral-800/50 backdrop-blur-md bg-neutral-900/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="text-xl font-bold text-white">Deployio</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Features
            </a>
            <a
              href="#stats"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Stats
            </a>
            <a
              href="#status"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Status
            </a>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-blue-400 text-sm font-medium">
            Deployed via Deployio Platform
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Ship Code,
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Not Infrastructure
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          The AI-powered DevOps platform that deploys your applications in
          seconds. Push your code, we handle the rest.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Start Deploying
          </button>
          <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-3 rounded-lg font-medium border border-neutral-700 transition-colors">
            View Demo
          </button>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-neutral-800/30 border border-neutral-800/50 rounded-xl p-6 text-center backdrop-blur-md"
            >
              <div className="text-3xl font-bold text-white mb-1">
                {s.value}
              </div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Everything You Need to Ship
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          From code push to production — Deployio automates the entire
          deployment pipeline.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-neutral-800/30 border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-colors backdrop-blur-md"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Status */}
      <section id="status" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Live Deployment Status
        </h2>
        <div className="bg-neutral-800/30 border border-neutral-800/50 rounded-xl p-8 backdrop-blur-md max-w-2xl mx-auto">
          {health ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-green-400 font-medium">
                  All Systems Operational
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Service
                  </div>
                  <div className="text-white font-medium">{health.service}</div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Uptime
                  </div>
                  <div className="text-white font-medium">
                    {Math.floor(health.uptime)}s
                  </div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Environment
                  </div>
                  <div className="text-white font-medium">
                    {health.environment}
                  </div>
                </div>
                <div className="bg-neutral-900/50 rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Status
                  </div>
                  <div className="text-white font-medium capitalize">
                    {health.status}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              Loading health status...
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>
            Deployed with ❤️ by Deployio Platform — This is an example MERN
            stack application
          </p>
        </div>
      </footer>
    </div>
  );
}
