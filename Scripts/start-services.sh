#!/bin/bash

# Master Startup Script for Notification Manager System
# This script starts both backend and frontend servers

echo "==========================================="
echo "Notification Manager System Startup"
echo "==========================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if netstat -an | grep ":$port " | grep -q LISTEN; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo "Checking for existing processes on port $port..."
    
    # Find and kill processes using the port
    local pids=$(netstat -ano | grep ":$port " | grep LISTEN | awk '{print $5}' | sort | uniq)
    
    if [ -n "$pids" ]; then
        echo "Found processes on port $port. Terminating..."
        for pid in $pids; do
            taskkill //PID $pid //F 2>/dev/null || true
        done
        sleep 2
    fi
}

# Create log directory
LOG_DIR="E:/notifmanager/logs"
mkdir -p "$LOG_DIR"

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
kill_port 8090  # Backend port
kill_port 3000  # Frontend port

# Wait a moment for processes to fully terminate
sleep 3

echo "Starting backend server..."
# Start backend in background and redirect output to log file
nohup bash "E:/notifmanager/start-backend.sh" > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start up (check for port availability)
echo "Waiting for backend to start..."
BACKEND_WAIT=0
MAX_BACKEND_WAIT=60  # Wait up to 60 seconds

while [ $BACKEND_WAIT -lt $MAX_BACKEND_WAIT ]; do
    if check_port 8090; then
        echo "Backend is running on port 8090"
        break
    fi
    sleep 2
    BACKEND_WAIT=$((BACKEND_WAIT + 2))
    echo "Waiting for backend... ($BACKEND_WAIT/${MAX_BACKEND_WAIT}s)"
done

if [ $BACKEND_WAIT -ge $MAX_BACKEND_WAIT ]; then
    echo "Warning: Backend may not have started properly"
    echo "Check the backend log at $LOG_DIR/backend.log"
else
    echo "Backend startup successful!"
fi

# Start frontend
echo "Starting frontend server..."
nohup bash "E:/notifmanager/start-frontend.sh" > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to start up
echo "Waiting for frontend to start..."
FRONTEND_WAIT=0
MAX_FRONTEND_WAIT=30  # Wait up to 30 seconds

while [ $FRONTEND_WAIT -lt $MAX_FRONTEND_WAIT ]; do
    if check_port 3000; then
        echo "Frontend is running on port 3000"
        break
    fi
    sleep 2
    FRONTEND_WAIT=$((FRONTEND_WAIT + 2))
    echo "Waiting for frontend... ($FRONTEND_WAIT/${MAX_FRONTEND_WAIT}s)"
done

if [ $FRONTEND_WAIT -ge $MAX_FRONTEND_WAIT ]; then
    echo "Warning: Frontend may not have started properly"
    echo "Check the frontend log at $LOG_DIR/frontend.log"
else
    echo "Frontend startup successful!"
fi

# Save PIDs for later reference
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

echo "==========================================="
echo "Notification Manager System Started"
echo "==========================================="
echo "Backend PID: $BACKEND_PID (Port 8090)"
echo "Frontend PID: $FRONTEND_PID (Port 3000)"
echo ""
echo "Access the application at: http://10.47.15.227:3000"
echo "Backend API available at: http://10.47.15.227:8090"
echo ""
echo "Logs are available at:"
echo "  Backend: $LOG_DIR/backend.log"
echo "  Frontend: $LOG_DIR/frontend.log"
echo ""
echo "To stop the services, run: bash E:/notifmanager/stop-services.sh"
echo "==========================================="

# Keep the script running to monitor the processes
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "$(date): Backend process stopped unexpectedly"
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "$(date): Frontend process stopped unexpectedly"
    fi
    
    sleep 30  # Check every 30 seconds
done
