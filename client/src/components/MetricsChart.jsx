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
  height = 200, // Reduced from 300 for compactness
  showGrid = true,
  strokeWidth = 2,
  fillOpacity = 0.1,
  className = "",
  unit = "",
  formatValue = null,
  formatTime = null,
  compact = false, // New compact mode
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
      className={`bg-neutral-900/60 backdrop-blur-lg border border-neutral-800/50 rounded-xl p-4 hover:bg-neutral-900/70 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-base heading">{title}</h3>
        {data.length > 0 && (
          <div className="text-xs text-gray-400">{data.length} data points</div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 opacity-30">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </div>
            <p className="text-sm body">No data available</p>
          </div>
        </div>
      ) : (
        <div style={{ height: compact ? height * 0.7 : height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="#374151"
                  opacity={0.2}
                />
              )}

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9CA3AF",
                  fontSize: 10,
                  fontFamily: "DM Sans, sans-serif",
                }}
                interval="preserveStartEnd"
                tickMargin={5}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#9CA3AF",
                  fontSize: 10,
                  fontFamily: "DM Sans, sans-serif",
                }}
                tickFormatter={(value) =>
                  formatValue ? formatValue(value) : `${value}${unit}`
                }
                width={60}
                tickMargin={5}
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
                    r: 3,
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 2,
                    shadow: `0 0 6px ${color}`,
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
                    r: 3,
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 2,
                    shadow: `0 0 6px ${color}`,
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
