import React, { useContext, useState, useEffect } from "react";
import "./Analytics.css";
import { NodeContext } from "../context/NodeContext";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import PressureChart from "../components/charts/PressureChart";
import PipeAgePressureChart from "../components/charts/PipeAgePressureChart";
import api from "../services/api";

export default function Analytics() {
  const { settings } = useContext(NodeContext);
  const [timeRange, setTimeRange] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    metrics: {
      averagePressure: "0.00 PSI",
      peakPressure: "0.00 PSI",
      averageUtilization: "0.0%",
      readingCount: 0
    },
    statusData: [],
    utilizationData: [],
    pressureTrend: []
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/dashboard/analytics?range=${timeRange}`);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, settings.safeThreshold, settings.warningThreshold]);

  const metrics = [
    {
      id: "avg-pressure",
      label: "Average Pressure",
      value: analyticsData.metrics.averagePressure,
      trend: `${analyticsData.metrics.readingCount || 0} readings in range`,
      trendUp: false,
      icon: Activity,
      color: "blue"
    },
    {
      id: "peak-pressure",
      label: "Peak Pressure",
      value: analyticsData.metrics.peakPressure,
      trend: "Highest stored reading",
      trendUp: true,
      icon: TrendingUp,
      color: "red"
    },
    {
      id: "avg-util",
      label: "Avg Utilization",
      value: analyticsData.metrics.averageUtilization,
      trend: `Thresholds ${Math.round(settings.safeThreshold * 100)}% / ${Math.round(settings.warningThreshold * 100)}%`,
      trendUp: false,
      icon: Activity,
      color: "purple"
    }
  ];

  const statusData = analyticsData.statusData;
  const utilizationData = analyticsData.utilizationData;
  const pressureTrend = analyticsData.pressureTrend || [];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={statusData[index].color} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="pie-custom-label"
      >
        {`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const CustomUtilTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="util-chart-tooltip">
          <p className="util-tooltip-title">{label}</p>
          <p className="util-tooltip-value">Utilization (%) : {payload[0].value.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="analytics-title">Historical Analytics</h1>
        <p className="analytics-subtitle">Data-driven insights and trends</p>
      </div>

      <div className="analytics-filters">
        <div className="analytics-filter-group">
          <Calendar size={18} className="analytics-filter-icon" strokeWidth={2.5} />
          <span className="analytics-filter-label">Time Range:</span>
          <div className="analytics-filter-buttons">
            <button 
              className={`filter-btn ${timeRange === "24h" ? "active" : ""}`}
              onClick={() => setTimeRange("24h")}
            >
              Last 24 Hours
            </button>
            <button 
              className={`filter-btn ${timeRange === "7d" ? "active" : ""}`}
              onClick={() => setTimeRange("7d")}
            >
              Last 7 Days
            </button>
            <button 
              className={`filter-btn ${timeRange === "30d" ? "active" : ""}`}
              onClick={() => setTimeRange("30d")}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-metrics-grid">
        {metrics.map((m) => (
          <div key={m.id} className="analytics-metric-card">
            <div className="metric-card-top">
              <div className="metric-card-info">
                <span className="metric-label">{m.label}</span>
                <h3 className="metric-value">{m.value}</h3>
              </div>
              <div className={`metric-icon-box bg-${m.color}`}>
                <m.icon size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div className="metric-card-bottom">
              {m.trendUp ? (
                <TrendingUp size={14} className="trend-icon-red" strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} className="trend-icon-green" strokeWidth={2.5} />
              )}
              <span className={`trend-text ${m.trendUp ? "trend-red" : "trend-green"}`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-chart-section">
        <div className="analytics-chart-card">
          <h3 className="chart-title">Pressure Trends</h3>
          <div className="chart-container">
             <PressureChart data={pressureTrend} />
          </div>
        </div>
      </div>

      <div className="analytics-secondary-charts">
        <div className="analytics-chart-card">
          <h3 className="chart-title">System Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  label={renderCustomizedLabel}
                  labelLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-chart-card">
          <h3 className="chart-title">Device Utilization</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={true} 
                  horizontal={true}
                  stroke="#E5E7EB" 
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#9CA3AF' }} 
                  tickLine={{ stroke: '#9CA3AF' }} 
                  tick={{fill: '#6B7280', fontSize: 11}}
                  interval={0}
                />
                <YAxis 
                  axisLine={{ stroke: '#9CA3AF' }} 
                  tickLine={{ stroke: '#9CA3AF' }} 
                  tick={{fill: '#6B7280', fontSize: 11}}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip 
                   cursor={{fill: '#f9fafb'}}
                   content={<CustomUtilTooltip />}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-chart-section">
        <div className="analytics-chart-card">
          <h3 className="chart-title">Pipe Age vs Current Pressure</h3>
          <div className="chart-container">
            <PipeAgePressureChart />
          </div>
        </div>
      </div>
    </div>
  );
}
