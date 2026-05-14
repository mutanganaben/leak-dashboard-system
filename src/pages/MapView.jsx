import React, { useContext, useState } from "react";
import "./MapView.css";
import { NodeContext } from "../context/NodeContext";
import { Info, MapPin, Activity, AlertCircle, Radio } from "lucide-react";

export default function MapView() {
  const { nodes, settings } = useContext(NodeContext);
  const [selectedNodeId, setSelectedNodeId] = useState(nodes?.[0]?.id || null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  if (!nodes || !settings) return null;

  if (!nodes || !settings) return null;

  // Enrich nodes with defaults if data is missing from backend
  const enrichedNodes = nodes.map((node, i) => ({
    ...node,
    lat: node.latitude || 40.7128,
    lng: node.longitude || -74.0060,
    // Layout positions could be added to the model later, for now we still use a default grid if missing
    layoutPos: node.layoutPos || { 
      top: `${20 + (Math.floor(i / 3) * 30)}%`, 
      left: `${15 + ((i % 3) * 35)}%` 
    },
    pipeAge: node.pipe_age || 0,
  }));

  const selectedNode = enrichedNodes.find(n => n.id === selectedNodeId) || enrichedNodes[0];

  const getStatus = (node) => {
    if (!node) return "safe";
    const utilization = node.maop > 0 ? node.pressure / node.maop : 0;
    if (utilization >= settings.warningThreshold) return "danger";
    if (utilization >= settings.safeThreshold) return "caution";
    return "safe";
  };

  const getStatusClasses = (status) => {
    if (status === "danger") return { bg: "map-status-danger", mark: "map-bg-red", pulse: "red" };
    if (status === "caution") return { bg: "map-status-caution", mark: "map-bg-yellow", pulse: "yellow" };
    return { bg: "map-status-safe", mark: "map-bg-green", pulse: "green" };
  };

  const renderDeviceDetails = (node) => {
    if (!node) return null;
    const status = getStatus(node);
    const classes = getStatusClasses(status);
    const utilization = node.maop > 0 ? (node.pressure / node.maop) * 100 : 0;

    return (
      <div className="map-card">
        <div className="map-card-header">
          <h3 className="map-card-title">Device Details</h3>
          <div className={`map-status-badge ${classes.bg}`}>
            {status === 'safe' || status === 'caution' ? <Activity size={14} /> : <AlertCircle size={14} />}
            <span>{status}</span>
          </div>
        </div>
        
        <div className="map-device-info-list">
          <div>
            <p className="map-label">Device Name</p>
            <p className="map-value">{node.name}</p>
          </div>
          
          <div>
            <p className="map-label">Location</p>
            <div className="map-location-wrap">
              <MapPin size={16} className="map-location-icon" />
              <span>{node.location}</span>
            </div>
          </div>
          
          <div className="map-inner-grid">
            <div>
              <p className="map-label">Current Pressure</p>
              <p className="map-value-xl">{node.pressure?.toFixed(1) || "0.0"} PSI</p>
            </div>
            <div>
              <p className="map-label">Threshold</p>
              <p className="map-value-xl">{node.maop || "0"} PSI</p>
            </div>
          </div>
          
          <div>
            <div className="map-util-header">
               <p className="map-label">Utilization</p>
               <p className="map-util-value">{utilization.toFixed(1)}%</p>
            </div>
            <div className="map-progress-bg">
               <div 
                  className={`map-progress-fill ${classes.mark}`} 
                  style={{ width: `${Math.min(utilization, 100)}%` }} 
               />
            </div>
          </div>
          
          <div className="map-details-footer">
            <div>
              <p className="map-label">Coordinates</p>
              <p className="map-code-block">
                {node.lat?.toFixed(6) || "0.000000"}<br/>
                {node.lng?.toFixed(6) || "0.000000"}
              </p>
            </div>
            
            <div className="map-inner-grid">
              <div>
                <p className="map-label">Pipe Age</p>
                <p className="map-value-sm">{node.pipeAge} Years</p>
              </div>
              <div>
                <p className="map-label">Device ID</p>
                <p className="map-code-block map-code-inline">
                  {node.deviceId || `sensor-${node.id?.toString().padStart(3, '0')}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="map-layout-wrapper">
      <div className="map-header">
        <h2 className="map-header-title">Sensor Locations</h2>
        <p className="map-header-subtitle">Interactive Layout View</p>
      </div>

      <div className="map-grid-container">
        <div className="map-left-column">
          <div className="map-card-header">
            <h3 className="map-card-title">System Area Layout</h3>
            <div className="map-card-info">
              <Info size={16} className="map-card-info-icon" />
              <span>Interactive View</span>
            </div>
          </div>
          
          <div className="map-view-area">
            <div className="sensor-layout-canvas">
              <div className="coords-info-badge">
                Lat: 40.7128, Lng: -74.0060
              </div>

              <div className="map-legend">
                <h4 className="map-legend-title">Status Legend</h4>
                <div className="map-legend-list">
                  <div className="map-legend-item">
                    <div className="map-legend-dot map-bg-green"></div>
                    Safe (&lt;{Math.round(settings.safeThreshold * 100)}%)
                  </div>
                  <div className="map-legend-item">
                    <div className="map-legend-dot map-bg-yellow"></div>
                    Caution ({Math.round(settings.safeThreshold * 100)}-{Math.round(settings.warningThreshold * 100)}%)
                  </div>
                  <div className="map-legend-item">
                    <div className="map-legend-dot map-bg-red"></div>
                    Warning (&gt;{Math.round(settings.warningThreshold * 100)}%)
                  </div>
                </div>
              </div>

              {enrichedNodes.map(node => {
                const status = getStatus(node);
                const classes = getStatusClasses(status);
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNodeId === node.id;
                
                return (
                  <div 
                    key={node.id} 
                    className={`sensor-marker-container ${isSelected ? 'selected' : ''}`}
                    style={{ top: node.layoutPos.top, left: node.layoutPos.left }}
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {isHovered && (
                      <div className="sensor-tooltip">
                        {node.location}
                      </div>
                    )}
                    <div className={`sensor-marker ${classes.mark} ${isSelected ? 'active' : ''}`}>
                      <Radio size={20} />
                      <div className={`sensor-pulse ${classes.pulse}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="map-right-column">
          {selectedNode ? renderDeviceDetails(selectedNode) : (
            <div className="map-card map-card-empty">
              <div className="map-empty-icon-box">
                <MapPin size={32} />
              </div>
              <p className="map-empty-text">Select a sensor on the map to view its details</p>
            </div>
          )}

          <div className="map-card">
            <h3 className="map-card-title map-list-spacing">All Devices</h3>
            <div className="map-list-wrapper">
              {enrichedNodes.map(node => {
                const status = getStatus(node);
                const classes = getStatusClasses(status);
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div 
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`map-list-item ${isSelected ? 'map-list-item-active' : 'map-list-item-inactive'}`}
                  >
                    <div className="map-list-item-flex">
                      <div>
                        <p className="map-list-item-title">{node.name}</p>
                        <p className="map-list-item-subtitle">{node.location}</p>
                        <p className="map-list-item-subtitle">{node.pressure?.toFixed(1) || "0.0"} PSI</p>
                      </div>
                      <div className={`map-list-item-status ${classes.mark}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
