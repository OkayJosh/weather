#!/bin/bash

# Integration Test Runner for Weather App with Playwright MCP
# This script sets up the environment and runs integration tests

set -e

echo "🧪 Weather App - Playwright MCP Integration Tests"
echo "================================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create one with WEATHER_API_KEY"
    echo "See .env.example for required environment variables"
    exit 1
fi

# Load environment variables
source .env

if [ -z "$WEATHER_API_KEY" ]; then
    echo "❌ Error: WEATHER_API_KEY not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"

# Install test dependencies if needed
echo "📦 Installing test dependencies..."
pip install -q playwright pytest pytest-asyncio httpx

# Install Playwright browsers if needed
echo "🌐 Ensuring Playwright browsers are installed..."
python -m playwright install

# Start services in background
echo "🚀 Starting services with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:8000/api/health > /dev/null && \
       curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Services are healthy!"
        break
    fi
    
    echo "   Waiting... ($((counter + 1))/${timeout})"
    sleep 2
    counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
    echo "❌ Services failed to become healthy within ${timeout} seconds"
    echo "Checking service logs:"
    docker-compose logs --tail=20
    docker-compose down
    exit 1
fi

# Run the integration tests
echo "🧪 Running Playwright MCP integration tests..."
echo ""

cd tests
python -m pytest test_weather_api_integration.py -v --tb=short

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All integration tests passed!"
else
    echo "❌ Some integration tests failed"
fi

# Cleanup
echo "🧹 Cleaning up..."
cd ..
docker-compose down

echo "📊 Test Summary:"
echo "   Exit code: $TEST_EXIT_CODE"
echo "   Services: Stopped"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 Integration tests completed successfully!"
else
    echo "💥 Integration tests failed. Check the output above for details."
fi

exit $TEST_EXIT_CODE
