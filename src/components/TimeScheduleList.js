import React from "react";

// Component for rendering time schedule list
const TimeScheduleList = React.memo(({ timeSchedules, onRemove, formatDate }) => {
  if (!timeSchedules.length) {
    return (
      <div className="no-schedules-message">
        <p>No time slots added yet. Add at least one time slot for scheduled content.</p>
      </div>
    );
  }

  return (
    <div className="scheduled-times-list">
      <h4>Added Time Slots ({timeSchedules.length})</h4>
      <div className="time-slots">
        {timeSchedules.map((schedule) => (
          <div key={schedule.id} className="time-slot">
            <div className="time-slot-info">
              <div className="time-slot-period">
                <strong>From:</strong> {formatDate(schedule.startTime)}
              </div>
              <div className="time-slot-period">
                <strong>To:</strong> {formatDate(schedule.endTime)}
              </div>
            </div>
            <button
              type="button"
              className="remove-schedule-btn"
              onClick={() => onRemove(schedule.id)}
              title="Remove this time slot"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TimeScheduleList;
