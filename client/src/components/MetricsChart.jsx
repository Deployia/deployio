import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const MetricsChart = ({
  data = [],
  title = "Metrics",
  type = "line", // 'line' or 'area'
  dataKey = "value",
  timeKey = "timestamp",
  color = "#3B82F6", // Default blue
  height = 300,
  showGrid = true,
  strokeWidth = 2,
  fillOpacity = 0.1,
  className = "",
  unit = "",
  formatValue = null,
  formatTime = null,
}) => {
  // Format data for recharts
  const chartData = data.map((item, index) => ({
    ...item,
    index,
    time: formatTime
      ? formatTime(item[timeKey])
      : new Date(item[timeKey]).toLocaleTimeString(),
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = formatValue
        ? formatValue(value)
        : `${value}${unit}`;

      return (
        <div className="bg-neutral-900/95 backdrop-blur-lg border border-neutral-700/50 rounded-lg p-3 shadow-xl">
          <p className="text-gray-300 text-sm font-medium mb-1">{label}</p>
          <p className="text-white font-semibold">
            <span
              style={{ color }}
              className="inline-block w-3 h-3 rounded-full mr-2"
            ></span>
            {title}: {formattedValue}
          </p>
        </div>
      );
    }
    return null;
  };

  // Chart component based on type
  const ChartComponent = type === "area" ? AreaChart : LineChart;

  return (
    <div
      className={`bg-neutral-900/40 backdrop-blur-lg border border-neutral-800/30 rounded-xl p-6 ${className}`}
    >
      <h3 className="text-white font-semibold text-lg mb-4 heading">{title}</h3>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <p className="body">No data available</p>
          </div>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
              )}

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9CA3AF",
                  fontSize: 12,
                  fontFamily: "DM Sans, sans-serif",
                }}
                interval="preserveStartEnd"
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9CA3AF",
                  fontSize: 12,
                  fontFamily: "DM Sans, sans-serif",
                }}
                tickFormatter={(value) =>
                  formatValue ? formatValue(value) : `${value}${unit}`
                }
              />

              <Tooltip content={<CustomTooltip />} />

              {type === "area" ? (
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={fillOpacity}
                  strokeWidth={strokeWidth}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;
