import React, { useContext, useState } from "react";
import "./NodeCard.css";
import { NodeContext } from "../../context/NodeContext";
import { Radio, MapPin, Check, AlertTriangle, Clock, Calendar, Activity, Edit2, Trash2, WifiOff } from "lucide-react";

const OFFLINE_AFTER_MS = 10 * 60 * 1000;

const isNodeOffline = (lastUpdate) => {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() > OFFLINE_AFTER_MS;
};

const formatLastUpdate = (lastUpdate) => {
  if (!lastUpdate) return "No readings";

  const elapsedMs = Date.now() - new Date(lastUpdate).getTime();
  const elapsedMinutes = Math.max(Math.floor(elapsedMs / 60000), 0);

  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min${elapsedMinutes === 1 ? "" : "s"} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
};

export default function NodeCard({ node }) {
  const { deleteNode, updateNode, settings } = useContext(NodeContext);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(node);

  const ratio = node.maop > 0 ? node.pressure / node.maop : 0;
  const utilization = (ratio * 100).toFixed(1);
  const offline = isNodeOffline(node.lastUpdate);

  let statusLabel = "Safe";
  let badgeProps = { bg: "#f0fdf4", color: "#15803d" };
  let progressBarBg = "#22c55e";
  let StatusIcon = Check;

  if (offline) {
    statusLabel = "Offline";
    badgeProps = { bg: "#f3f4f6", color: "#4b5563" };
    progressBarBg = "#9ca3af";
    StatusIcon = WifiOff;
  } else if (ratio >= settings.warningThreshold) {
    statusLabel = "Warning";
    badgeProps = { bg: "#fef2f2", color: "#b91c1c" };
    progressBarBg = "#ef4444";
    StatusIcon = AlertTriangle;
  } else if (ratio >= settings.safeThreshold) {
    statusLabel = "Caution";
    badgeProps = { bg: "#fefce8", color: "#a16207" };
    progressBarBg = "#eab308";
    StatusIcon = AlertTriangle;
  }

  const handleUpdate = () => {
    updateNode({ ...form, maop: Number(form.maop), pipeAge: Number(form.pipeAge), pressure: Number(form.pressure) });
    setEditing(false);
  };

  const isCritical = !offline && ratio >= settings.warningThreshold;

  if (editing) {
    return (
      <div className="node-card-edit-wrap">
        <h3 className="node-card-edit-title">Edit Configuration</h3>
        <label className="node-card-edit-label">Node Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="node-card-edit-input"
        />

        <label className="node-card-edit-label">Location</label>
        <input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="node-card-edit-input"
        />

        <label className="node-card-edit-label">Device ID</label>
        <input
          value={form.deviceId || ""}
          onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
          className="node-card-edit-input"
        />

        <label className="node-card-edit-label">Threshold (MAOP)</label>
        <input
          type="number"
          value={form.maop}
          onChange={(e) => setForm({ ...form, maop: Number(e.target.value) })}
          className="node-card-edit-input"
        />

        <label className="node-card-edit-label">Pipe Age</label>
        <input
          type="number"
          value={form.pipeAge || 0}
          onChange={(e) => setForm({ ...form, pipeAge: Number(e.target.value) })}
          className="node-card-edit-input"
        />

        <div className="node-card-edit-btns">
          <button onClick={handleUpdate} className="node-card-edit-save">Save Changes</button>
          <button onClick={() => setEditing(false)} className="node-card-edit-cancel">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="node-card-wrap" style={{ borderColor: isCritical ? '#fecaca' : offline ? '#e5e7eb' : '#f3f4f6', boxShadow: isCritical ? '0 1px 2px 0 rgba(254, 202, 202, 0.5)' : undefined }}>
      <div className="node-card-header">
        <div className="node-card-header-left">
          <div className="node-card-icon-box" style={{ backgroundColor: isCritical ? '#fef2f2' : offline ? '#f3f4f6' : '#eff6ff', color: isCritical ? '#ef4444' : offline ? '#6b7280' : '#3b82f6' }}>
            <Radio size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="node-card-title">{node.name}</h3>
            <div className="node-card-loc">
              <MapPin size={16} className="node-card-loc-icon" />
              {node.location || "Unknown Location"}
            </div>
            <div className="node-card-loc">
              {node.deviceId || "No device ID"}
            </div>
          </div>
        </div>

        <div className="node-card-header-right">
          <div className="node-card-badge" style={{ backgroundColor: badgeProps.bg, color: badgeProps.color }}>
            <StatusIcon size={16} strokeWidth={2.5} />
            <span>{statusLabel}</span>
          </div>
          <div className="node-card-actions">
            <button onClick={() => setEditing(true)} className="node-card-action-btn node-card-action-edit" title="Edit Node">
              <Edit2 size={14} />
            </button>
            <button onClick={() => deleteNode(node.id)} className="node-card-action-btn node-card-action-del" title="Delete Node">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="node-card-stats">
        <div>
          <p className="node-card-stat-label">Current Pressure</p>
          <p className="node-card-stat-val" style={{ color: isCritical ? '#dc2626' : offline ? '#6b7280' : undefined }}>{node.pressure.toFixed(1)} PSI</p>
        </div>
        <div>
          <p className="node-card-stat-label">Threshold</p>
          <p className="node-card-stat-val">{node.maop} PSI</p>
        </div>
      </div>

      <div className="node-card-util-wrap">
        <div className="node-card-util-header">
          <span className="node-card-util-label">Utilization</span>
          <span className="node-card-util-val">{utilization}%</span>
        </div>
        <div className="node-card-util-track">
          <div className="node-card-util-fill" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: progressBarBg }} />
        </div>
      </div>

      <div className="node-card-footer">
        <div className="node-card-footer-item">
          <div className="node-card-footer-label">
            <Clock size={14} style={{marginRight: '4px'}}/> Last Update
          </div>
          <div className="node-card-footer-val">{formatLastUpdate(node.lastUpdate)}</div>
        </div>
        
        <div className="node-card-footer-item">
          <div className="node-card-footer-label">
            <Calendar size={14} style={{marginRight: '4px'}}/> Pipe Age
          </div>
          <div className="node-card-footer-val">{node.pipeAge ?? 0} years</div>
        </div>
        
        <div className="node-card-footer-item">
          <div className="node-card-footer-label">
            <Activity size={14} style={{marginRight: '4px'}}/> Status
          </div>
          <div className="node-card-footer-val">{offline ? "Offline" : "Online"}</div>
        </div>
      </div>
    </div>
  );
}
