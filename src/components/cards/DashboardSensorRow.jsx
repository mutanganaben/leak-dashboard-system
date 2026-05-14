import React, { useContext } from "react";
import "./DashboardSensorRow.css";
import { NodeContext } from "../../context/NodeContext";
import { CheckCircle2, TriangleAlert, AlertCircle, WifiOff } from "lucide-react";

const OFFLINE_AFTER_MS = 10 * 60 * 1000;

const isNodeOffline = (lastUpdate) => {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() > OFFLINE_AFTER_MS;
};

const formatLastUpdate = (lastUpdate) => {
  if (!lastUpdate) return "No readings";

  const elapsedMinutes = Math.max(Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 60000), 0);
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min${elapsedMinutes === 1 ? "" : "s"} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

export default function DashboardSensorRow({ node }) {
  const { settings } = useContext(NodeContext);

  const ratio = node.maop > 0 ? node.pressure / node.maop : 0;
  let percentage = (ratio * 100).toFixed(1);
  if (isNaN(percentage)) percentage = "0.0";
  const offline = isNodeOffline(node.lastUpdate);

  let status = "Safe";
  let dotColor = "#4ade80";
  let badgeProps = { bg: "#f0fdf4", color: "#16a34a" };
  let Icon = CheckCircle2;

  if (offline) {
    status = "Offline";
    dotColor = "#9ca3af";
    badgeProps = { bg: "#f3f4f6", color: "#4b5563" };
    Icon = WifiOff;
  } else if (ratio >= settings.warningThreshold) {
    status = "Warning";
    dotColor = "#f87171";
    badgeProps = { bg: "#fef2f2", color: "#dc2626" };
    Icon = AlertCircle;
  } else if (ratio >= settings.safeThreshold) {
    status = "Caution";
    dotColor = "#facc15";
    badgeProps = { bg: "#fefce8", color: "#ca8a04" };
    Icon = TriangleAlert;
  }

  return (
    <div className="dash-sensor-card">
      <div className="dash-sensor-left">
        <div className="dash-sensor-dot" style={{ backgroundColor: dotColor }}></div>
        <div>
          <h3 className="dash-sensor-title">{node.name}</h3>
          <p className="dash-sensor-loc">{node.location}</p>
          <p className="dash-sensor-update">{formatLastUpdate(node.lastUpdate)}</p>
        </div>
      </div>

      <div className="dash-sensor-right">
        <div className="dash-sensor-stats">
          <p className="dash-sensor-psi">{node.pressure.toFixed(1)} PSI</p>
          <p className="dash-sensor-pct">{percentage}%</p>
        </div>

        <div className="dash-sensor-badge" style={{ backgroundColor: badgeProps.bg, color: badgeProps.color }}>
          <Icon size={14} strokeWidth={2.5} />
          <span>{status}</span>
        </div>
      </div>
    </div>
  );
}
