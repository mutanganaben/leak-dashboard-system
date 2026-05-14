import React, { useContext } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import "./PipeAgePressureChart.css";
import { NodeContext } from "../../context/NodeContext";

const CustomCursor = (props) => {
// ... (omitted for brevity in replacement, but I will include it)
  const { x, y, width, height } = props;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 0, 0, 0.08)"
      className="pipe-chart-cursor"
    />
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="pipe-chart-tooltip">
        <p className="pipe-tooltip-location">{label}</p>
        <div className="pipe-tooltip-divider"></div>
        <div className="pipe-tooltip-row">
          <span className="pipe-tooltip-dot purple"></span>
          <span className="pipe-tooltip-label">Pipe Age (years):</span>
          <span className="pipe-tooltip-value purple">{payload[0].value}</span>
        </div>
        <div className="pipe-tooltip-row">
          <span className="pipe-tooltip-dot blue"></span>
          <span className="pipe-tooltip-label">Current Pressure (PSI):</span>
          <span className="pipe-tooltip-value blue">{payload[1].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function PipeAgePressureChart() {
  const { nodes } = useContext(NodeContext);
  
  const data = nodes?.map(node => ({
    name: node.name,
    age: node.pipeAge || 0,
    pressure: node.pressure || 0
  })) || [];

  return (
    <div className="pipe-age-pressure-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barGap={6}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={true} 
            horizontal={true}
            stroke="#d1d5db"
            strokeOpacity={0.8}
          />
          <XAxis 
            dataKey="name" 
            axisLine={{ stroke: '#9ca3af', strokeWidth: 1.5 }} 
            tickLine={{ stroke: '#9ca3af' }} 
            tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
            dy={15}
          />
          {/* Left Y-Axis for Pipe Age */}
          <YAxis 
            yAxisId="left"
            orientation="left"
            domain={[0, 20]}
            ticks={[0, 5, 10, 15, 20]}
            axisLine={{ stroke: '#9ca3af' }}
            tickLine={{ stroke: '#9ca3af' }}
            tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
            label={{ 
              value: 'Age (years)', 
              angle: -90, 
              position: 'insideLeft', 
              offset: -10, 
              fill: '#4b5563', 
              fontSize: 13, 
              fontWeight: 600 
            }}
          />
          {/* Right Y-Axis for Pressure */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            axisLine={{ stroke: '#9ca3af' }}
            tickLine={{ stroke: '#9ca3af' }}
            tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
            label={{ 
              value: 'Pressure (PSI)', 
              angle: 90, 
              position: 'insideRight', 
              offset: -10, 
              fill: '#4b5563', 
              fontSize: 13, 
              fontWeight: 600 
            }}
          />
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={<CustomCursor />} 
            allowEscapeViewBox={{ x: false, y: true }}
          />
          
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: '50px' }}
            formatter={(value) => (
              <span style={{ color: '#4b5563', fontSize: '13px', fontWeight: 600, paddingLeft: '4px' }}>{value}</span>
            )}
          />

          <Bar 
            yAxisId="left"
            dataKey="age" 
            name="Pipe Age (years)" 
            fill="#a855f7" 
            radius={[4, 4, 0, 0]}
            barSize={38}
          />
          <Bar 
            yAxisId="right"
            dataKey="pressure" 
            name="Current Pressure (PSI)" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            barSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
