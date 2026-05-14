import React from "react";
import "./PressureChart.css";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const values = payload.reduce((acc, item) => {
      acc[item.dataKey] = item.value;
      return acc;
    }, {});

    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-values">
          <p className="tooltip-max">Max Pressure : {(values.maxPressure || 0).toFixed(2)} PSI</p>
          <p className="tooltip-avg">Avg Pressure : {(values.averagePressure || 0).toFixed(2)} PSI</p>
          <p className="tooltip-min">Min Pressure : {(values.minPressure || 0).toFixed(2)} PSI</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function PressureChart({ data }) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="pressure-chart-empty">
        No pressure history available for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
        <defs>
          <linearGradient id="colorAveragePressure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorMaxPressure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          axisLine={{ stroke: '#9ca3af' }} 
          tickLine={{ stroke: '#9ca3af' }} 
          tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
          dy={10}
        />
        <YAxis 
          axisLine={{ stroke: '#9ca3af' }} 
          tickLine={{ stroke: '#9ca3af' }} 
          tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="maxPressure"
          name="Max Pressure"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorMaxPressure)"
        />
        <Area
          type="monotone"
          dataKey="averagePressure"
          name="Avg Pressure"
          stroke="#10b981" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorAveragePressure)" 
        />
        <Area
          type="monotone"
          dataKey="minPressure"
          name="Min Pressure"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={0}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          content={(props) => {
            return (
              <div className="custom-chart-legend">
                <span className="legend-item max"><span className="dot red"></span> Max Pressure</span>
                <span className="legend-item avg"><span className="dot blue"></span> Avg Pressure</span>
                <span className="legend-item min"><span className="dot green"></span> Min Pressure</span>
              </div>
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
