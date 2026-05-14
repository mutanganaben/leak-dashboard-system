import React, { useContext, useState, useEffect } from "react";
import "./Dashboard.css";
import { NodeContext } from "../context/NodeContext";
import PressureChart from "../components/charts/PressureChart";
import RealTimePressureChart from "../components/charts/RealTimePressureChart";
import DashboardSensorRow from "../components/cards/DashboardSensorRow";
import { Radio, Activity, TrendingUp, AlertCircle, Gauge, Zap, Droplets, WifiOff } from "lucide-react";
import api from "../services/api";

export default function Dashboard() {
  const { nodes, settings } = useContext(NodeContext);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    activeSensors: 0,
    safeCount: 0,
    cautionCount: 0,
    warningCount: 0,
    offlineCount: 0,
    totalSensors: 0,
    averagePressure: 0,
    averageMaop: 0,
    utilization: 0,
    totalAlerts: 0
  });

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/summary');
      setSummary(data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
    const intervalMs = Math.max(Number(settings.updateInterval) || 3, 1) * 1000;
    const interval = setInterval(fetchDashboardSummary, intervalMs);

    return () => clearInterval(interval);
  }, [settings.safeThreshold, settings.warningThreshold, settings.updateInterval]);

  const {
    activeSensors,
    safeCount,
    cautionCount,
    warningCount,
    offlineCount,
    averagePressure: systemPressure,
    averageMaop: systemMaop,
    utilization
  } = summary;

  let systemStatusText = "Safe";
  let statusColor = "dash-status-bg-green";
  let progressColor = "dash-progress-fill-green";

  if (utilization >= (settings.warningThreshold * 100)) {
    systemStatusText = "Danger";
    statusColor = "dash-status-bg-red";
    progressColor = "dash-progress-fill-red";
  } else if (utilization >= (settings.safeThreshold * 100)) {
    systemStatusText = "Caution";
    statusColor = "dash-status-bg-yellow";
    progressColor = "dash-progress-fill-yellow";
  } else if (offlineCount > 0) {
    systemStatusText = "Offline Devices";
    statusColor = "dash-status-bg-gray";
  }

  return (
    <div className="dash-layout-wrapper">
      <div className="dash-header">
        <h2 className="dash-header-title">System Overview</h2>
        <p className="dash-header-subtitle">Real-time monitoring and predictive analytics</p>
      </div>

      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Active Sensors</p>
            <h3 className="dash-metric-value">{activeSensors}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-blue">
            <Radio size={24} strokeWidth={2.5} />
          </div>
        </div>

        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Safe Status</p>
            <h3 className="dash-metric-value">{safeCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-green"><Activity size={24} strokeWidth={2.5} /></div>
        </div>

        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Caution</p>
            <h3 className="dash-metric-value">{cautionCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-yellow"><TrendingUp size={24} strokeWidth={2.5} /></div>
        </div>

        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Warnings</p>
            <h3 className="dash-metric-value">{warningCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-red"><AlertCircle size={24} strokeWidth={2.5} /></div>
        </div>

        <div className="dash-metric-card">
          <div>
            <p className="dash-metric-label">Offline</p>
            <h3 className="dash-metric-value">{offlineCount}</h3>
          </div>
          <div className="dash-metric-icon-box dash-icon-gray"><WifiOff size={24} strokeWidth={2.5} /></div>
        </div>

      </div>

      <div className="dash-section-card">
        <div className="dash-section-header">
          <h3 className="dash-section-title">Current System Status</h3>
          <div className={`dash-status-badge ${statusColor}`}>
            {systemStatusText === 'Caution' && <AlertCircle size={16} strokeWidth={2.5} />}
            {systemStatusText === 'Danger' && <AlertCircle size={16} strokeWidth={2.5} />}
            {systemStatusText === 'Safe' && <Activity size={16} strokeWidth={2.5} />}
            {systemStatusText === 'Offline Devices' && <WifiOff size={16} strokeWidth={2.5} />}
            <span>{systemStatusText}</span>
          </div>
        </div>

        <div className="dash-stats-row">
          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-blue"><Gauge size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Current Pressure</p>
              <p className="dash-stat-value">{systemPressure.toFixed(2)} PSI</p>
            </div>
          </div>

          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-purple"><Droplets size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Threshold (MAOPadj)</p>
              <p className="dash-stat-value">{systemMaop.toFixed(0)} PSI</p>
            </div>
          </div>

          <div className="dash-stat-item">
            <div className="dash-metric-icon-box dash-icon-orange"><Zap size={24} strokeWidth={2.5} /></div>
            <div>
              <p className="dash-stat-label">Utilization</p>
              <p className="dash-stat-value">{utilization.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div>
          <div className="dash-progress-header">
            <p className="dash-progress-label">Pressure Level</p>
            <p className="dash-progress-value">{systemPressure.toFixed(2)} / {systemMaop.toFixed(0)} PSI</p>
          </div>

          <div className="dash-progress-track">
            <div className={`dash-progress-fill ${progressColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
          </div>

          <div className="dash-progress-legend">
            <span>0%</span>
            <span className="dash-text-green">{Math.round(settings.safeThreshold * 100)}% Safe</span>
            <span className="dash-text-yellow">{Math.round(settings.warningThreshold * 100)}% Caution</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <RealTimePressureChart />

      <div className="dash-sensors-section">
        <h3 className="dash-sensors-title">Active Sensors</h3>
        <div className="dash-sensors-list">
          {nodes.map((node) => (
            <DashboardSensorRow key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
