import React, { useContext, useState, useEffect } from "react";
import "./Alerts.css";
import { Bell, BellOff, AlertCircle, Filter, Check, X, AlertTriangle, InfoIcon } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { NodeContext } from "../context/NodeContext";

export default function Alerts() {
  const { settings } = useContext(NodeContext);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [syncSummary, setSyncSummary] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.get('/alerts');
      const nextAlerts = Array.isArray(data) ? data : data.alerts || [];
      setAlerts(nextAlerts);
      setSyncSummary(Array.isArray(data) ? null : data.syncSummary);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error(error.message || 'Unable to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const intervalMs = Math.max(Number(settings.updateInterval) || 3, 1) * 1000;
    const interval = setInterval(fetchAlerts, intervalMs);

    return () => clearInterval(interval);
  }, [settings.updateInterval]);

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/alerts/${id}/acknowledge`);
      setAlerts(prev => prev.map(alert => 
        alert._id === id ? { ...alert, acknowledged: true } : alert
      ));
      toast.success('Alert acknowledged.');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error(error.message || 'Unable to acknowledge alert.');
    }
  };

  const handleDismiss = (id) => {
    setDismissedAlerts(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const totalAlerts = alerts.length;
  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;
  const criticalWarnings = alerts.filter((a) => a.level === "warning" && !a.acknowledged).length;

  const filteredAlerts = alerts.filter((a) => {
    if (dismissedAlerts.has(a._id)) return false;
    if (!showAcknowledged && a.acknowledged) return false;
    if (filter !== "All" && a.level.toLowerCase() !== filter.toLowerCase()) return false;
    return true;
  });

  const getTypeConfig = (level) => {
    switch (level) {
      case "warning":
        return { border: "border-red-200", iconBg: "bg-red-50", iconColor: "dash-text-red text-red-500", Icon: AlertCircle, badgeBg: "bg-red-50", badgeText: "text-red-600", messageColor: "text-red-600", label: "Warning" };
      case "caution":
        return { border: "border-yellow-300", iconBg: "bg-yellow-50", iconColor: "dash-text-yellow", Icon: AlertTriangle, badgeBg: "bg-yellow-100", badgeText: "text-yellow-700", messageColor: "text-yellow-700", label: "Caution" };
      case "info":
        return { border: "border-blue-200", iconBg: "bg-blue-50", iconColor: "dash-text-blue text-blue-500", Icon: InfoIcon, badgeBg: "bg-blue-50", badgeText: "text-blue-600", messageColor: "text-blue-600", label: "Info" };
      default:
        return { border: "border-gray-200", iconBg: "bg-gray-50", iconColor: "text-gray-500", Icon: Bell, badgeBg: "bg-gray-100", badgeText: "text-gray-600", messageColor: "text-gray-600", label: "Unknown" };
    }
  };

  return (
    <div className="alerts-layout-wrapper">
      <div>
        <h2 className="alerts-header-title">Alert Management</h2>
        <p className="alerts-header-subtitle">Monitor and manage system notifications</p>
      </div>

      {syncSummary?.maintenanceMode && (
        <div className="alerts-filter-bar" style={{ borderColor: '#fde047', backgroundColor: '#fefce8' }}>
          <div className="alerts-filter-label" style={{ color: '#a16207' }}>
            <AlertTriangle size={18} className="alerts-filter-icon" />
            <span>Maintenance mode is active. New alert creation is paused.</span>
          </div>
        </div>
      )}

      <div className="alerts-summary-grid">
        <div className="alerts-summary-card">
          <div>
            <p className="alerts-summary-label">Total Signals</p>
            <h3 className="alerts-summary-value">{totalAlerts}</h3>
          </div>
          <div className="alerts-icon-box dash-icon-blue"><Bell size={24} /></div>
        </div>

        <div className="alerts-summary-card">
          <div>
            <p className="alerts-summary-label">Unacknowledged</p>
            <h3 className="alerts-summary-value">{unacknowledged}</h3>
          </div>
          <div className="alerts-icon-box dash-icon-orange"><BellOff size={24} /></div>
        </div>

        <div className="alerts-summary-card">
          <div>
            <p className="alerts-summary-label">Critical Warnings</p>
            <h3 className="alerts-summary-value">{criticalWarnings}</h3>
          </div>
          <div className="alerts-icon-box dash-icon-red"><AlertCircle size={24} /></div>
        </div>
      </div>

      <div className="alerts-filter-bar">
        <div className="alerts-filter-left">
          <div className="alerts-filter-label">
            <Filter size={18} className="alerts-filter-icon" />
            <span>Filter by:</span>
          </div>
          <div className="alerts-filter-buttons">
            {["All", "Warning", "Caution", "Info"].map((f) => (
              <button
                key={f} onClick={() => setFilter(f)}
                className={`alerts-filter-btn ${filter === f ? "alerts-filter-btn-active" : "alerts-filter-btn-inactive"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <label className="alerts-checkbox-label">
          <input
            type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="alerts-checkbox-input"
          />
          <span className="alerts-checkbox-text">Show acknowledged</span>
        </label>
      </div>

      <div className="alerts-list-wrapper">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const config = getTypeConfig(alert.level);
            const Icon = config.Icon;

            return (
              <div key={alert._id} className="alerts-item-card" style={{ borderColor: config.border.includes('red') ? '#fecaca' : config.border.includes('yellow') ? '#fde047' : config.border.includes('blue') ? '#bfdbfe' : '#e5e7eb' }}>
                <div className="alerts-item-flex">
                  <div className={`alerts-icon-box alerts-icon-full`} style={{ backgroundColor: config.iconBg.includes('red') ? '#fef2f2' : config.iconBg.includes('yellow') ? '#fefce8' : config.iconBg.includes('blue') ? '#eff6ff' : '#f9fafb', color: config.iconColor.includes('red') ? '#ef4444' : config.iconColor.includes('yellow') ? '#ca8a04' : config.iconColor.includes('blue') ? '#3b82f6' : '#6b7280'}}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="alerts-item-content">
                    <div className="alerts-item-header">
                      <div>
                        <h4 className="alerts-item-title">{alert.nodeName || "System Node"}</h4>
                        <p className="alerts-item-location">{alert.location || "Unknown location"}</p>
                      </div>
                      
                      <div className="alerts-badge-group">
                        {alert.acknowledged && (
                          <span className="alerts-badge" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                            <Check size={14} /><span>Acknowledged</span>
                          </span>
                        )}
                        <span className="alerts-badge" style={{ backgroundColor: config.badgeBg.includes('red') ? '#fef2f2' : config.badgeBg.includes('yellow') ? '#fef9c3' : config.badgeBg.includes('blue') ? '#eff6ff' : '#f3f4f6', color: config.badgeText.includes('red') ? '#dc2626' : config.badgeText.includes('yellow') ? '#a16207' : config.badgeText.includes('blue') ? '#2563eb' : '#4b5563' }}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <p className="alerts-item-message" style={{ color: config.messageColor.includes('red') ? '#dc2626' : config.messageColor.includes('yellow') ? '#a16207' : config.messageColor.includes('blue') ? '#2563eb' : '#4b5563' }}>
                      {alert.message}
                    </p>

                    <div className="alerts-item-footer">
                      <p className="alerts-item-timestamp">
                        {new Date(alert.createdAt).toLocaleString()}
                        {alert.utilization !== undefined ? ` • ${alert.utilization}% utilization` : ''}
                      </p>
                      <div className="alerts-action-group">
                        {!alert.acknowledged && (
                          <button onClick={() => handleAcknowledge(alert._id)} className="alerts-ack-btn">
                            <Check size={16} /><span>Acknowledge</span>
                          </button>
                        )}
                        <button onClick={() => handleDismiss(alert._id)} className="alerts-dismiss-btn" title="Dismiss">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="alerts-empty-state">
            <Bell className="alerts-empty-icon" />
            <p className="alerts-empty-title">{loading ? 'Loading alerts...' : 'No system signals found matching criteria.'}</p>
            <p className="alerts-empty-subtitle">{loading ? 'Loading alert history.' : "You're completely caught up!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
