import Link from "next/link";

const deployments = [
  {
    name: "deployio-mern-production",
    status: "running",
    env: "production",
    uptime: "99.9%",
    stack: "MERN",
  },
  {
    name: "deployio-next-staging",
    status: "running",
    env: "staging",
    uptime: "99.8%",
    stack: "Next.js",
  },
  {
    name: "deployio-fastapi-dev",
    status: "running",
    env: "development",
    uptime: "99.5%",
    stack: "FastAPI",
  },
  {
    name: "analytics-api",
    status: "building",
    env: "staging",
    uptime: "-",
    stack: "Express",
  },
  {
    name: "landing-page",
    status: "stopped",
    env: "production",
    uptime: "98.2%",
    stack: "React",
  },
];

const statusColors = {
  running: "bg-green-400",
  building: "bg-yellow-400",
  stopped: "bg-red-400",
  pending: "bg-blue-400",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 min-h-screen border-r border-neutral-800/50 bg-neutral-900/30 backdrop-blur-md p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="text-lg font-bold text-white">Deployio</span>
          </div>
          <nav className="space-y-1">
            {[
              "Dashboard",
              "Projects",
              "Deployments",
              "Monitoring",
              "Settings",
            ].map((item, i) => (
              <div
                key={item}
                className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-neutral-800/50 text-white" : "text-gray-400 hover:text-white hover:bg-neutral-800/30"} transition-colors cursor-pointer`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8">
          <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Overview of your deployments and projects
                </p>
              </div>
              <Link
                href="/api/health"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                API Health →
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Total Projects",
                  value: "5",
                  change: "+2 this month",
                },
                { label: "Active Deployments", value: "3", change: "0 failed" },
                {
                  label: "Avg Build Time",
                  value: "28s",
                  change: "-12% faster",
                },
                {
                  label: "Overall Uptime",
                  value: "99.7%",
                  change: "Last 30 days",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-neutral-800/30 border border-neutral-800/50 rounded-xl p-5 backdrop-blur-md"
                >
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    {s.label}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {s.value}
                  </div>
                  <div className="text-gray-500 text-xs">{s.change}</div>
                </div>
              ))}
            </div>

            {/* Deployments Table */}
            <div className="bg-neutral-800/30 border border-neutral-800/50 rounded-xl backdrop-blur-md overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800/50">
                <h2 className="text-lg font-semibold text-white">
                  Recent Deployments
                </h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800/50">
                    <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">
                      Environment
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">
                      Stack
                    </th>
                    <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">
                      Uptime
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d) => (
                    <tr
                      key={d.name}
                      className="border-b border-neutral-800/30 hover:bg-neutral-800/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {d.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${statusColors[d.status]} ${d.status === "running" ? "animate-pulse" : ""}`}
                          ></span>
                          <span className="text-sm text-gray-300 capitalize">
                            {d.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${d.env === "production" ? "bg-red-500/10 text-red-400" : d.env === "staging" ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"}`}
                        >
                          {d.env}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {d.stack}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {d.uptime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
