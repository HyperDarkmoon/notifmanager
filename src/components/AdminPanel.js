import React, { useState } from "react";
import "../styles/admin.css";
import ContentScheduleTab from "./ContentScheduleTab";
import TVProfilesTab from "./TVProfilesTab";

function AdminPanel() {
  // Tab state
  const [activeTab, setActiveTab] = useState("content");

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Content Management</h1>
        <p className="admin-subtitle">
          Schedule and manage content for TV displays
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          <span className="tab-icon">📝</span>
          Content Schedules
        </button>
        <button
          className={`tab-button ${activeTab === "profiles" ? "active" : ""}`}
          onClick={() => setActiveTab("profiles")}
        >
          <span className="tab-icon">👥</span>
          TV Profiles
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "content" && <ContentScheduleTab />}
        {activeTab === "profiles" && <TVProfilesTab />}
      </div>
    </div>
  );
}

export default React.memo(AdminPanel);
