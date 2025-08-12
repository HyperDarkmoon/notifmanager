#!/bin/bash

# Notification Backend Startup Script
# This script starts the Spring Boot backend server

echo "========================================="
echo "Starting Notification Backend Server"
echo "========================================="

# Backend directory
BACKEND_DIR="E:/notificationbackend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Backend directory $BACKEND_DIR not found!"
    echo "Please ensure the backend is located at $BACKEND_DIR"
    exit 1
fi

# Navigate to backend directory
cd "$BACKEND_DIR" || exit 1

echo "Current directory: $(pwd)"
echo "Starting Spring Boot application..."

# Check if Maven wrapper exists
if [ -f "./mvnw" ]; then
    echo "Using Maven wrapper..."
    # Start Spring Boot application with production profile
    ./mvnw spring-boot:run -Dspring-boot.run.profiles=production
elif [ -f "./gradlew" ]; then
    echo "Using Gradle wrapper..."
    # Start Spring Boot application
    ./gradlew bootRun --args='--spring.profiles.active=production'
elif command -v mvn &> /dev/null; then
    echo "Using system Maven..."
    # Start Spring Boot application with production profile
    mvn spring-boot:run -Dspring-boot.run.profiles=production
elif command -v gradle &> /dev/null; then
    echo "Using system Gradle..."
    # Start Spring Boot application
    gradle bootRun --args='--spring.profiles.active=production'
else
    echo "Error: Neither Maven nor Gradle found!"
    echo "Please install Maven or Gradle to run the backend."
    exit 1
fi

echo "Backend server startup script completed."
