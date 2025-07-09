import React, { useState } from 'react';
import company from './imgs/company.png';
import './App.css';

function App() {
  const [selectedTV, setSelectedTV] = useState(1);

  const handleSliderChange = (event) => {
    setSelectedTV(parseInt(event.target.value));
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <img src={company} alt="Company Logo" className="company-logo" />
          <h1 className="navbar-title">Notification Manager</h1>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="tv-selector-container">
          <h2>Select a TV</h2>
          <div className="slider-container">
            <label htmlFor="tv-slider" className="slider-label">
              TV {selectedTV}
            </label>
            <input
              id="tv-slider"
              type="range"
              min="1"
              max="4"
              value={selectedTV}
              onChange={handleSliderChange}
              className="tv-slider"
            />
            <div className="slider-labels">
              <span>TV 1</span>
              <span>TV 2</span>
              <span>TV 3</span>
              <span>TV 4</span>
            </div>
          </div>
          
          <div className="selected-tv-display">
            <h3>Currently Selected:</h3>
            <div className="tv-card">
              <div className="tv-icon">📺</div>
              <p>Television {selectedTV}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
