import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { adminTokens } from "@/constants/adminDesignTokens";

const defaultMonthTick = (value) => {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const AdminTrendChart = ({
  title,
  subtitle,
  data = [],
  series = [{ key: "count", name: "Count", color: "#60A5FA" }],
  chartType = "area",
  emptyMessage = "No data available",
  dateKey = "date",
  tickFormatter,
}) => {
  const hasData = data.length > 0 && series.some((s) => data.some((d) => (d[s.key] || 0) > 0));
  const Chart = chartType === "line" ? LineChart : AreaChart;
  const formatTick =
    tickFormatter ||
    ((value) => {
      if (!value) return "";
      if (dateKey === "period") return defaultMonthTick(value);
      return String(value).slice(5);
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${adminTokens.chartCard} h-full`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={adminTokens.sectionTitle}>{title}</h3>
        {subtitle && <span className="text-sm text-gray-400 body hidden sm:inline">{subtitle}</span>}
      </div>
      {!hasData ? (
        <p className="text-gray-500 text-sm body text-center py-12">{emptyMessage}</p>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.2} />
              <XAxis
                dataKey={dateKey}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickFormatter={formatTick}
              />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23,23,23,0.95)",
                  border: "1px solid rgba(64,64,64,0.5)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#D1D5DB" }}
              />
              {series.length > 1 && <Legend />}
              {series.map((s) =>
                chartType === "line" ? (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ) : (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    fill={s.color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default AdminTrendChart;
