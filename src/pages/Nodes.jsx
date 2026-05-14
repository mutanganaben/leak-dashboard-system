import React, { useState, useContext } from "react";
import "./Nodes.css";
import NodeCard from "../components/cards/NodeCard";
import Alerts from "../components/alerts/Alerts";
import { NodeContext } from "../context/NodeContext";
import AddNodeForm from "../components/nodes/AddNodeForm";
import { Search, Filter } from "lucide-react";

const OFFLINE_AFTER_MS = 10 * 60 * 1000;

const isNodeOffline = (lastUpdate) => {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() > OFFLINE_AFTER_MS;
};

export default function Nodes() {
  const { nodes, settings } = useContext(NodeContext);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const getStatus = (node) => {
    if (isNodeOffline(node.lastUpdate)) return "OFFLINE";
    const ratio = (node.maop > 0) ? (node.pressure / node.maop) : 0;
    if (ratio >= settings.warningThreshold) return "WARNING";
    if (ratio >= settings.safeThreshold) return "CAUTION";
    return "SAFE";
  };

  const filteredNodes = nodes.filter((node) => 
    node.name.toLowerCase().includes(search.toLowerCase()) ||
    node.location.toLowerCase().includes(search.toLowerCase())
  )
  .filter((node) => {
    if (filter === "ALL") return true;
    return getStatus(node) === filter;
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    const priority = { WARNING: 4, CAUTION: 3, OFFLINE: 2, SAFE: 1 };
    return priority[getStatus(b)] - priority[getStatus(a)];
  });

  return (
    <div className="nodes-layout-wrapper">
      <div>
        <h2 className="nodes-header-title">Device Management</h2>
        <p className="nodes-header-subtitle">Monitor and manage all sensor nodes</p>
      </div>

      <div className="nodes-control-row">
        <div className="nodes-search-wrap">
          <div className="nodes-search-icon-box">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="nodes-search-input"
          />
        </div>

        <div className="nodes-filters-wrap">
          <button className="nodes-filter-btn">
            <Filter size={18} />
          </button>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="nodes-filter-select"
          >
            <option value="ALL">All Status</option>
            <option value="SAFE">Safe</option>
            <option value="CAUTION">Caution</option>
            <option value="WARNING">Warning</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      <div className="nodes-grid">
        {sortedNodes.length > 0 ? (
          sortedNodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))
        ) : (
          <div className="nodes-empty-state">
            No devices matches your current filters.
          </div>
        )}
      </div>

      <div className="nodes-footer-section">
        <h3 className="nodes-footer-title">Add New Node</h3>
        <div className="nodes-form-card">
           <AddNodeForm />
        </div>
      </div>

      
    </div>
  );
}
