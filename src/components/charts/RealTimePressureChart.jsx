import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import "./RealTimePressureChart.css";
import api from "../../services/api";
import { NodeContext } from "../../context/NodeContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return (
      <div className="rt-chart-tooltip">
        <p className="rt-tooltip-time">{timeStr}</p>
        <p className="rt-tooltip-value">Current Pressure: <span className="rt-value-highlight">{payload[0].value.toFixed(2)}</span></p>
      </div>
    );
  }
  return null;
};

export default function RealTimePressureChart() {
  const { settings } = useContext(NodeContext);
  const [data, setData] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const timerRef = useRef(null);
  const updateIntervalSeconds = Math.max(Number(settings.updateInterval) || 3, 1);
  const safePercent = Math.round(settings.safeThreshold * 100);
  const cautionPercent = Math.round(settings.warningThreshold * 100);

  const fetchHistory = async () => {
    try {
      const historyData = await api.get('/dashboard/history');
      setData(historyData);
      setIsLive(true);
    } catch (error) {
      console.error('Error fetching system history:', error);
      setIsLive(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    timerRef.current = setInterval(fetchHistory, updateIntervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [updateIntervalSeconds]);

  const xTicks = useMemo(() => {
    if (data.length < 2) return [];
    const min = data[0].timestamp;
    const max = data[data.length - 1].timestamp;
    const count = 6;
    const interval = (max - min) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i++) {
      ticks.push(Math.round(min + i * interval));
    }
    return ticks;
  }, [data]);

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="rt-pressure-card">
      <div className="rt-card-header">
        <div className="rt-header-left">
          <h3 className="rt-card-title">Real-time Pressure Monitoring</h3>
          <p className="rt-card-subtitle">Last 2 hours - updates every {updateIntervalSeconds} seconds</p>
        </div>
        <div className="rt-header-right">
          <div className={`rt-live-indicator ${isLive ? 'active' : ''}`}>
            <span className="rt-dot"></span>
            <span className="rt-live-text">{isLive ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="rt-chart-container">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={data} margin={{ top: 20, right: 80, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="rtColorPressure" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
              horizontal={true}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tickFormatter={formatXAxis}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              tickLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              height={50}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              tickLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              ticks={[0, 25, 50, 75, 100]}
              label={{
                value: 'Pressure (PSI)',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fill: '#64748b',
                fontSize: 12,
                fontWeight: 600
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />

            <ReferenceLine
              y={safePercent}
              stroke="#22c55e"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{ position: 'right', value: `Safe (${safePercent}%)`, fill: '#22c55e', fontSize: 11, fontWeight: 600, offset: 10 }}
            />

            <ReferenceLine
              y={cautionPercent}
              stroke="#eab308"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{ position: 'right', value: `Caution (${cautionPercent}%)`, fill: '#eab308', fontSize: 11, fontWeight: 600, offset: 10 }}
            />

            <ReferenceLine
              y={100}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{ position: 'right', value: 'Threshold', fill: '#ef4444', fontSize: 11, fontWeight: 600, offset: 10 }}
            />

            <Area
              type="monotone"
              dataKey="pressure"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#rtColorPressure)"
              animationDuration={500}
              isAnimationActive={true}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              content={() => (
                <div className="rt-custom-legend">
                  <span className="rt-legend-indicator"></span>
                  <span className="rt-legend-text">Current Pressure</span>
                </div>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
