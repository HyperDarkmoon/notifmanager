import React from "react";

// Component for daily schedule time inputs
const DailyScheduleInput = React.memo(({ 
  dailyStartTime, 
  dailyEndTime, 
  onTimeChange, 
  onSetCurrentTime,
  isDailySchedule,
  onToggleDailySchedule
}) => {
  return (
    <div className="daily-schedule-section">
      <div className="daily-schedule-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isDailySchedule}
            onChange={(e) => onToggleDailySchedule(e.target.checked)}
          />
          <span>🔄 Daily Repeating Schedule</span>
          <small>Set hours and minutes only - repeats every day until stopped</small>
        </label>
      </div>

      {isDailySchedule && (
        <div className="daily-time-inputs">
          <div className="schedule-buttons">
            <button
              type="button"
              className="schedule-helper-btn current"
              onClick={onSetCurrentTime}
              title="Set current time as start point"
            >
              🕒 Use Current Time
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Daily Start Time</label>
            <input
              type="time"
              name="dailyStartTime"
              value={dailyStartTime}
              onChange={onTimeChange}
              className="form-input"
            />
            <small className="form-help">Content will start at this time every day</small>
          </div>

          <div className="form-group">
            <label className="form-label">Daily End Time</label>
            <input
              type="time"
              name="dailyEndTime"
              value={dailyEndTime}
              onChange={onTimeChange}
              className="form-input"
            />
            <small className="form-help">Content will end at this time every day</small>
          </div>

          <div className="daily-schedule-info">
            <div className="info-box">
              <strong>📅 Daily Schedule:</strong>
              <p>
                This content will display from <strong>{dailyStartTime}</strong> to <strong>{dailyEndTime}</strong> every day.
                {dailyStartTime && dailyEndTime && (
                  <span>
                    {" "}Duration: {calculateDuration(dailyStartTime, dailyEndTime)}
                  </span>
                )}
              </p>
              <p><em>The schedule will continue daily until you manually stop it.</em></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function to calculate duration between two times
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "Not set";
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  let duration = end - start;
  if (duration < 0) {
    // Handle next day scenario (e.g., 23:00 to 01:00)
    duration += 24 * 60 * 60 * 1000;
  }
  
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export default DailyScheduleInput;
