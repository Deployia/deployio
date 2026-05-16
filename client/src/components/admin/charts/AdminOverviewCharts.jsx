import AdminDistributionChart from "./AdminDistributionChart";
import AdminTrendChart from "./AdminTrendChart";

const AdminOverviewCharts = ({ charts = {} }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
    <AdminTrendChart
      title="User signups"
      subtitle="Last 30 days"
      data={charts.userSignupsTrend || []}
      series={[{ key: "count", name: "New users", color: "#60A5FA" }]}
    />
    <AdminTrendChart
      title="Deployments"
      subtitle="Last 14 days"
      data={charts.deploymentsTrend || []}
      chartType="line"
      series={[
        { key: "successful", name: "Successful", color: "#34D399" },
        { key: "failed", name: "Failed", color: "#F87171" },
      ]}
    />
    <AdminDistributionChart
      title="Deployment status"
      subtitle="Current snapshot"
      data={charts.deploymentStatusBreakdown || []}
    />
    <AdminDistributionChart
      title="User roles"
      subtitle="Current snapshot"
      data={charts.roleDistribution || []}
    />
  </div>
);

export default AdminOverviewCharts;
