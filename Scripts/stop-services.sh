#!/bin/bash

# Stop Services Script for Notification Manager System
# This script stops both backend and frontend servers

echo "==========================================="
echo "Stopping Notification Manager System"
echo "==========================================="

LOG_DIR="E:/notifmanager/logs"

# Function to kill process on a specific port
kill_port() {
    local port=$1
    echo "Stopping processes on port $port..."
    
    # Find and kill processes using the port
    local pids=$(netstat -ano | grep ":$port " | grep LISTEN | awk '{print $5}' | sort | uniq)
    
    if [ -n "$pids" ]; then
        echo "Found processes on port $port. Terminating..."
        for pid in $pids; do
            echo "Killing PID: $pid"
            taskkill //PID $pid //F 2>/dev/null || true
        done
        echo "Processes on port $port terminated."
    else
        echo "No processes found on port $port."
    fi
}

# Function to kill process by PID from file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo "Stopping $service_name (PID: $pid)..."
        
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null || taskkill //PID $pid //F 2>/dev/null || true
            echo "$service_name stopped."
        else
            echo "$service_name was not running."
        fi
        
        rm -f "$pid_file"
    else
        echo "No PID file found for $service_name."
    fi
}

# Stop by PID files if they exist
if [ -d "$LOG_DIR" ]; then
    kill_by_pid_file "$LOG_DIR/backend.pid" "Backend"
    kill_by_pid_file "$LOG_DIR/frontend.pid" "Frontend"
fi

# Stop by port as backup
kill_port 8090  # Backend port
kill_port 3000  # Frontend port

# Kill any remaining node/java processes related to our applications
echo "Cleaning up any remaining processes..."

# Kill remaining npm/node processes that might be from our frontend
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "node.*react-scripts" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true

# Kill remaining Java processes that might be from our backend
pkill -f "java.*spring-boot" 2>/dev/null || true
pkill -f "mvn.*spring-boot:run" 2>/dev/null || true
pkill -f "gradle.*bootRun" 2>/dev/null || true

echo "Waiting for processes to terminate..."
sleep 3

# Final check
echo "Final port check:"
if netstat -an | grep ":8090 " | grep -q LISTEN; then
    echo "Warning: Port 8090 still in use"
else
    echo "Port 8090 is free"
fi

if netstat -an | grep ":3000 " | grep -q LISTEN; then
    echo "Warning: Port 3000 still in use"
else
    echo "Port 3000 is free"
fi

echo "==========================================="
echo "Notification Manager System Stopped"
echo "==========================================="
