import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const NodeContext = createContext();

const defaultFrontendSettings = {
  safeThreshold: 0.7,
  warningThreshold: 0.85,
  updateInterval: 3,
  alertSounds: true,
};

const toFrontendSettings = (settings) => ({
  safeThreshold: Number(settings.safeThreshold ?? 70) / 100,
  warningThreshold: Number(settings.cautionThreshold ?? 85) / 100,
  updateInterval: Number(settings.updateInterval ?? 3),
  alertSounds: Boolean(settings.pushNotifications ?? true),
});

function NodeProvider({ children }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(defaultFrontendSettings);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/nodes');
      // Map _id to id for frontend compatibility and ensure pressure/history exist
      setNodes(data.map(node => ({
        ...node,
        id: node._id,
        pressure: node.pressure || 0,
        history: node.history || [],
        lastUpdate: node.lastUpdate || null
      })));
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      const frontendSettings = toFrontendSettings(data);
      setSettings(frontendSettings);
      return frontendSettings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return defaultFrontendSettings;
    }
  };

  const applyBackendSettings = (nextSettings) => {
    const frontendSettings = toFrontendSettings(nextSettings);
    setSettings(frontendSettings);
    return frontendSettings;
  };

  useEffect(() => {
  if (localStorage.getItem('authToken')) {  
    fetchNodes();
    fetchSettings();
  } else {
    setLoading(false); 
  }
}, []);

  useEffect(() => {
    if (!localStorage.getItem('authToken')) return undefined;

    const intervalMs = Math.max(Number(settings.updateInterval) || 3, 1) * 1000;
    const interval = setInterval(fetchNodes, intervalMs);

    return () => clearInterval(interval);
  }, [settings.updateInterval]);

  const addNode = async (newNodeData) => {
    const savedNode = await api.post('/nodes', newNodeData);
    const frontendNode = {
      ...savedNode,
      id: savedNode._id,
      pressure: savedNode.pressure || 0,
      history: savedNode.history || [],
      lastUpdate: savedNode.lastUpdate || null
    };

    setNodes((prev) => [
      frontendNode,
      ...prev,
    ]);

    return frontendNode;
  };

  const deleteNode = async (id) => {
    try {
      await api.delete(`/nodes/${id}`);
      setNodes((prev) => prev.filter((node) => node.id !== id));
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const updateNode = async (updatedNodeData) => {
    try {
      const savedNode = await api.put(`/nodes/${updatedNodeData.id}`, updatedNodeData);
      setNodes((prev) =>
        prev.map((node) =>
          node.id === updatedNodeData.id ? { ...savedNode, id: savedNode._id } : node
        )
      );
    } catch (error) {
      console.error('Error updating node:', error);
    }
  };

  return (
    <NodeContext.Provider value={{ 
      nodes, 
      setNodes, 
      addNode, 
      deleteNode, 
      updateNode, 
      settings, 
      setSettings,
      fetchSettings,
      applyBackendSettings,
      loading 
    }}>
      {children}
    </NodeContext.Provider>
  );
}

export default NodeProvider;
