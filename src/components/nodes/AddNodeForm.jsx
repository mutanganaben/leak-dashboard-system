import React, { useState, useContext } from "react";
import "./AddNodeForm.css";
import { NodeContext } from "../../context/NodeContext";
import toast from "react-hot-toast";

export default function AddNodeForm() {
  const { addNode } = useContext(NodeContext);

  const [form, setForm] = useState({
    name: "",
    deviceId: "",
    location: "",
    maop: "",
    pipeAge: "",
    latitude: "40.7128",
    longitude: "-74.0060"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.deviceId || !form.location || !form.maop || !form.pipeAge) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const savedNode = await addNode({
        name: form.name.trim(),
        deviceId: form.deviceId.trim(),
        location: form.location.trim(),
        maop: Number(form.maop),
        pipeAge: Number(form.pipeAge),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });

      toast.success(`${savedNode.name} saved successfully`);
      setForm({ 
        name: "", 
        deviceId: "",
        location: "", 
        maop: "", 
        pipeAge: "", 
        latitude: "40.7128", 
        longitude: "-74.0060" 
      });
    } catch (error) {
      toast.error(error.message || "Unable to add node");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cp-form-card">
      <h3 className="cp-form-title">Add New Node</h3>

      <div className="cp-form-grid">
        <input
          placeholder="Node Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="cp-form-input"
        />

        <input
          placeholder="Device ID (e.g. sensor-kigali-001)"
          value={form.deviceId}
          onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
          className="cp-form-input"
        />

        <input
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="MAOP (PSI)"
          value={form.maop}
          onChange={(e) => setForm({ ...form, maop: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Pipe Age (years)"
          value={form.pipeAge}
          onChange={(e) => setForm({ ...form, pipeAge: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          className="cp-form-input"
        />

        <input
          type="number"
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          className="cp-form-input"
        />
      </div>

      <button className="cp-form-submit" disabled={submitting}>
        {submitting ? "Adding Node..." : "Add Node"}
      </button>
    </form>
  );
}
