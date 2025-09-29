# Full-Stack Weather App with DDD/Hexagonal Architecture

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green)](#)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](#)

A production-grade weather application built with **Domain-Driven Design (DDD)** and **Hexagonal Architecture** principles. Features a FastAPI backend with Pydantic entity mapping, React TypeScript frontend, and comprehensive testing including Playwright MCP integration tests.

## 🌟 Features

- **🏗️ Hexagonal Architecture**: Clean separation of concerns with domain, application, infrastructure, and interface layers
- **📊 Domain-Driven Design**: Rich domain models with Pydantic entities and value objects
- **🌐 Modern Tech Stack**: FastAPI backend + React TypeScript frontend
- **🐳 Docker Ready**: Complete containerization with Docker Compose
- **✅ Comprehensive Testing**: Unit tests + Playwright MCP integration tests
- **📱 Responsive UI**: Modern, mobile-friendly interface
- **⚡ Real-time Weather**: Powered by WeatherAPI.com
- **💾 Intelligent Caching**: Built-in caching for optimal performance
- **🔒 Production Security**: Security headers, input validation, error handling

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **WeatherAPI.com** free account (get your API key)

### Setup

1. **Clone and setup**:
   ```bash
   git clone https://github.com/OkayJosh/weather
   cd weather-app
   cp .env.example .env
   ```

2. **Get WeatherAPI key**:
   - Visit [WeatherAPI.com](https://www.weatherapi.com/)
   - Create a free account (1M calls/month free)
   - Copy your API key

3. **Configure environment**:
   ```bash
   # Edit .env file and add your API key
   WEATHER_API_KEY=your_actual_api_key_here
   ```

4. **Launch application**:
   ```bash
   docker compose up --build
   ```

5. **Access the app**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

### Domain-Driven Design Structure

```
weather-app/
├── backend/
│   └── app/
│       ├── domain/          # 🏛️ Domain Layer
│       │   ├── entities.py  # Aggregate roots & entities
│       │   └── errors.py    # Domain exceptions
│       ├── application/     # 📋 Application Layer
│       │   ├── use_cases.py # Business logic orchestration
│       │   └── ports.py     # Interface definitions
│       ├── infrastructure/  # 🔧 Infrastructure Layer
│       │   ├── weather_client.py # External API adapter
│       │   └── cache.py     # Caching implementation
│       └── interface/       # 🌐 Interface Layer
│           └── api.py       # FastAPI routes & controllers
├── frontend/
│   └── src/
│       ├── components/      # React components
│       ├── lib/            # API client & utilities
│       └── App.tsx         # Main application
├── tests/                  # 🧪 Integration tests
└── docker-compose.yml     # 🐳 Container orchestration
```

### Hexagonal Architecture Benefits

- **🎯 Domain-Centric**: Business logic is isolated and testable
- **🔌 Pluggable Adapters**: Easy to swap external services
- **🧪 Testable**: Each layer can be tested independently
- **📈 Scalable**: Clear boundaries enable team scaling
- **🔄 Maintainable**: Changes are localized to specific layers

## 🛠️ Development

### Local Development Setup

**Backend Development**:
```bash
cd backend

# Setup Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Development**:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Start as a single application using docker compose in development**:
```bash
docker compose -f docker-compose.yml up --build -d
```


### Testing

**Unit Tests**:
```bash
cd backend
pytest tests/ -v --cov=app
```

**Integration Tests** (Playwright MCP):
```bash
# Ensure services are running first
docker compose up -d

# Run integration tests
./run_integration_tests.sh
```

**Frontend Tests**:
```bash
cd frontend
npm test
```

## 📚 API Documentation

### Core Endpoints

**Weather Endpoint**:
```http
GET /api/weather?city={city_name}
```

**Success Response** (200):
```json
{
  "city": "London",
  "temperature": 15.5,
  "humidity": 65,
  "wind_speed": 12.3,
  "condition": "Partly cloudy",
  "fetched_at": "2024-01-15T10:00:00Z",
  "provider": "weatherapi"
}
```

**Error Response** (422):
```json
{
  "code": "UNKNOWN_CITY",
  "message": "Invalid or unknown city: InvalidCity",
  "details": {}
}
```

**Health Check**:
```http
GET /api/health
```

Full API documentation available at: `http://localhost:8000/docs`

## 🧪 Testing Strategy

### Test Pyramid Implementation

1. **Unit Tests** (85%): Domain logic, use cases, adapters
2. **Integration Tests** (10%): API endpoints with Playwright MCP
3. **End-to-End Tests** (5%): Full user workflows

### Playwright MCP Integration

The project includes comprehensive Playwright MCP tests that validate:
- API contract compliance with WeatherAPI Swagger 1.0.2
- Error handling and edge cases
- Response time and performance
- Concurrent request handling
- Security headers and CORS

## 🚀 Deployment

### Production Deployment

**Docker Production Build**:
```bash
# Production optimized build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

**Environment Configuration**:
- Set `DEBUG=false` in production
- Use strong secrets management
- Configure proper logging
- Set up monitoring and alerting

### Cloud Deployment Options

- **AWS**: ECS with Fargate + ALB
- **Google Cloud**: Cloud Run + Load Balancer
- **Azure**: Container Instances + Front Door
- **Kubernetes**: Helm charts available in `/k8s`

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEATHER_API_KEY` | ✅ | - | WeatherAPI.com API key |
| `WEATHER_API_BASE_URL` | ❌ | `https://api.weatherapi.com/v1` | API base URL |
| `API_TIMEOUT` | ❌ | `10` | Request timeout (seconds) |
| `CACHE_TTL` | ❌ | `300` | Cache TTL (seconds) |
| `DEBUG` | ❌ | `false` | Enable debug mode |

### Performance Tuning

- **Caching**: Responses cached for 5 minutes (configurable)
- **Timeouts**: 10-second timeout for external API calls
- **Concurrency**: Built-in async support with FastAPI
- **Frontend**: Static asset caching with nginx

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**: Run linting and tests
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

### Coding Standards

- **Python**: Follow PEP 8, use Black formatting
- **TypeScript**: Follow Airbnb style guide
- **Testing**: Maintain >90% code coverage
- **Documentation**: Document all public APIs

## 📊 Monitoring & Observability

### Health Checks

- **Backend**: `/api/health` endpoint
- **Frontend**: `/health` endpoint  
- **Docker**: Built-in healthchecks in containers

### Logging

- **Structured logging** with timestamps
- **Error tracking** with stack traces
- **Performance metrics** for API calls
- **Security audit logs**

### Metrics

- API response times
- Error rates by endpoint
- Cache hit/miss ratios
- External API performance

## 🔐 Security

### Security Features

- **Input Validation**: Pydantic models with strict validation
- **CORS Configuration**: Properly configured for frontend
- **Security Headers**: XSS protection, content sniffing prevention
- **Rate Limiting**: Configurable rate limits
- **Secrets Management**: Environment-based configuration

### Security Best Practices

- API keys stored as environment variables
- Non-root containers in Docker
- Regular dependency updates
- Comprehensive error handling without data leakage

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key" Error**:
```bash
# Check your .env file
cat .env | grep WEATHER_API_KEY

# Verify API key at WeatherAPI.com dashboard
```

**Services won't start**:
```bash
# Check Docker daemon
docker --version
docker compose --version

# Check port conflicts
lsof -i :3000
lsof -i :8000

# View logs
docker compose logs backend
docker compose logs frontend
```

**Tests failing**:
```bash
# Ensure services are running
docker-compose ps

# Check service health
curl http://localhost:8000/api/health
curl http://localhost:3000/health
```

### Getting Help

- 📖 Check the [API Documentation](http://localhost:8000/docs)
- 🐛 [Open an issue](https://github.com/OkayJosh/weather/issues)
- 💬 [Discussion forum](https://github.com/OkayJosh/weather/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WeatherAPI.com** for providing free weather data
- **FastAPI** for the amazing Python web framework
- **React** and **Vite** for the frontend tools
- **Playwright** for comprehensive testing capabilities
- **Docker** for containerization

---

**Built with ❤️ using Domain-Driven Design and Hexagonal Architecture**
