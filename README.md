# Sentinel EV - Intelligent Grid-Aware EV Charging Platform

> **Preventing grid collapse through AI-powered charging orchestration**

Sentinel EV is a real-time digital twin platform that prevents distribution transformer failures by intelligently managing EV charging loads. Built on IEC 60076-7 thermal standards, it uses ML-based demand forecasting and self-healing agents to balance grid stability with user convenience.

---

## 🎯 The Problem

Unmanaged EV charging is pushing distribution transformers beyond safe operating limits:
- **110°C+ temperatures** cause transformer degradation and failure
- **Peak hour clustering** creates dangerous load spikes
- **Reactive maintenance** leads to costly downtime and grid instability

**Sentinel EV solves this by predicting, preventing, and recovering from grid stress events.**

---

## ✨ Key Features

### 🧠 AI-Powered Intelligence
- **ML Demand Forecasting**: LSTM-based prediction of charging patterns
- **Smart Scheduling**: Automatically shifts loads to off-peak hours
- **Self-Healing Agents**: Detects faults and executes recovery actions autonomously

### 🗺️ Real-Time Digital Twin
- **Live Station Monitoring**: Track load, temperature, and status across all stations
- **Interactive Map**: Visualize grid health with color-coded station markers
- **Thermal Simulation**: Physics-based transformer temperature modeling

### ⚡ Grid-Safe Booking
- **Impact Analysis**: Simulates grid effect before confirming bookings
- **Automatic Optimization**: Suggests alternative slots when conflicts detected
- **Emergency Override**: Priority handling for critical battery levels (<20%)

### 🔧 Self-Healing System
- **Fault Detection**: Real-time anomaly detection in telemetry data
- **Root Cause Diagnosis**: AI-powered analysis of failure patterns
- **Automated Recovery**: Executes corrective actions without human intervention

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Sentinel Map │  │ Booking Flow │  │ Agent Terminal│      │
│  │  (Leaflet)   │  │  (Framer)    │  │   (React)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express + Node.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Scheduling   │  │ Analytics    │  │ Grid Manager │      │
│  │ Controller   │  │ Controller   │  │ Controller   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   MongoDB    │    │ Flask ML API │    │ OpenCharge   │
│  (Telemetry) │    │ (LSTM Model) │    │     API      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+ with pip
- **MongoDB** 5.0+
- **OpenCharge API Key** (free at [openchargemap.org](https://openchargemap.org))

### 1. Clone and Install

```bash
git clone <repository-url>
cd CodeFusion

# Install frontend dependencies
cd app-demo
npm install

# Install backend dependencies
cd ../Backend
npm install

# Install ML service dependencies
cd ../ML-Services
pip install -r requirements.txt
```

### 2. Configure Environment

**Backend** (`Backend/.env`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ev-charging
FLASK_ML_SERVICE_URL=http://localhost:5000
OPENCHARGE_API_KEY=your_api_key_here
```

**Frontend** (`app-demo/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Start Services

**Terminal 1 - MongoDB:**
```bash
mongod --dbpath /path/to/data
```

**Terminal 2 - ML Service:**
```bash
cd ML-Services
python app.py
# Runs on http://localhost:5000
```

**Terminal 3 - Backend:**
```bash
cd Backend
npm start
# Runs on http://localhost:3000
```

**Terminal 4 - Frontend:**
```bash
cd app-demo
npm run dev
# Runs on http://localhost:5173
```

### 4. Access the Platform

Open **http://localhost:5173** in your browser.

---

## 📖 User Guide

### Booking a Charging Slot

1. **Select a City**: Choose from 9+ major Indian cities
2. **Browse Stations**: View nearby stations sorted by safety status (green first)
3. **Click a Station**: See real-time metrics (load, temperature, capacity)
4. **Book Slot**: System analyzes grid impact in real-time
5. **Handle Conflicts**: Accept Sentinel optimization if grid is stressed

### Understanding Station Status

| Status | Color | Meaning | Action |
|--------|-------|---------|--------|
| **Safe** | 🟢 Green | Load <70%, Temp <85°C | Book freely |
| **Warning** | 🟡 Yellow | Load 70-90%, Temp 85-110°C | Booking may be delayed |
| **Critical** | 🔴 Red | Load >90%, Temp >110°C | Booking blocked, optimization required |

### Monitoring Grid Health

- **Map View**: Color-coded markers show station health at a glance
- **Sidebar Metrics**: Real-time load, temperature, and slot availability
- **Agent Terminal**: Watch self-healing actions in real-time

---

## 🔌 API Reference

### Core Endpoints

#### Schedule Charging (Grid-Aware)
```bash
POST /api/schedule/balanced
Content-Type: application/json

{
  "vehicleId": "EV201",
  "stationId": 5,
  "requiredKwh": 25,
  "deadline": "2026-01-24T22:00:00Z",
  "maxDelayMinutes": 45,
  "batteryLevel": 35,
  "region": "Bangalore"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduledStart": "2026-01-24T20:15:00Z",
    "chargingRate": "slow",
    "gridSafe": true,
    "actualDelayMinutes": 20,
    "reason": "shifted_to_off_peak"
  }
}
```

#### Get ML Demand Forecast
```bash
GET /api/forecast/peak?stationId=5
```

**Response:**
```json
{
  "success": true,
  "predictedPeakHours": [
    { "hour": 18, "predicted_powerKW": 110.2 },
    { "hour": 19, "predicted_powerKW": 105.6 }
  ]
}
```

#### Find Nearby Stations
```bash
GET /api/stations/nearby?lat=12.9716&lng=77.5946&radius=5
```

**Full API documentation**: See [Backend/API-DOCUMENTATION.md](Backend/API-DOCUMENTATION.md)

---

## 🧪 Testing

### Frontend Tests
```bash
cd app-demo
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
```

### Backend Tests
```bash
cd Backend
npm test
```

### Property-Based Testing
The system uses **fast-check** for property-based testing to validate correctness properties:
- Slot booking invariants
- Grid safety constraints
- Scheduling optimization properties

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Leaflet** - Interactive maps
- **Zustand** - State management
- **Recharts** - Data visualization

### Backend
- **Node.js + Express** - REST API
- **MongoDB** - Telemetry storage
- **Mongoose** - ODM
- **Axios** - HTTP client

### ML Services
- **Python + Flask** - ML API
- **TensorFlow/Keras** - LSTM models
- **NumPy/Pandas** - Data processing

### External APIs
- **OpenCharge Map** - Real-time station data

---

## 📊 System Capabilities

### Scheduling Intelligence
- **Peak Avoidance**: Automatically shifts loads to off-peak hours
- **Grid Constraints**: Enforces 90% safety margin on transformer capacity
- **User Convenience**: Respects deadline and max delay preferences
- **Priority Override**: Emergency handling for battery <20%

### Self-Healing Agent
- **Fault Detection**: Monitors voltage, current, temperature anomalies
- **Diagnosis Engine**: Identifies root causes (overload, thermal, voltage)
- **Recovery Actions**: Executes load shedding, cooling, voltage regulation
- **State Machine**: Manages agent lifecycle (idle → monitoring → diagnosing → recovering)

### Analytics
- **Hourly Demand Patterns**: Historical analysis by hour of day
- **Peak Hour Identification**: Top 3 busiest hours per station
- **Regional Trends**: Daily power consumption by region
- **Grid Impact Reports**: Peak load reduction metrics

---

## 🎮 Demo Scenarios

### Scenario 1: Normal Booking
1. Select a **green (safe)** station
2. Click "Book Slot"
3. System confirms immediately
4. Slot allocated, grid remains stable

### Scenario 2: Grid Conflict
1. Select a **red (critical)** station
2. Click "Book Slot"
3. System detects transformer overload risk
4. Sentinel suggests optimized slot
5. Accept optimization → booking confirmed with delay

### Scenario 3: Self-Healing
1. Open Agent Terminal
2. Trigger fault simulation
3. Watch agent detect anomaly
4. Observe diagnosis and recovery
5. System returns to normal operation

---

## 📁 Project Structure

```
CodeFusion/
├── app-demo/                 # Frontend React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── map/          # Leaflet map integration
│   │   │   ├── ui/           # Modals, panels, overlays
│   │   │   └── twin/         # Digital twin sidebar
│   │   ├── store/            # Zustand state management
│   │   ├── data/             # Mock data and city configs
│   │   ├── hooks/            # Custom React hooks
│   │   └── api/              # API client and transformers
│   └── package.json
│
├── Backend/                  # Express REST API
│   ├── controllers/          # Request handlers
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── server.js
│
├── ML-Services/              # Flask ML API
│   ├── app.py                # Flask server
│   ├── Demand pattern/       # LSTM model files
│   └── requirements.txt
│
├── agent/                    # Self-healing agent system
│   ├── types.ts              # Core interfaces
│   ├── faultDetector.ts      # Anomaly detection
│   ├── diagnosisEngine.ts    # Root cause analysis
│   ├── recoveryActions.ts    # Automated recovery
│   ├── ui/                   # Agent terminal UI
│   └── tests/                # Agent tests
│
└── README.md                 # This file
```

---

## 🔐 Security Considerations

- **API Keys**: Never commit `.env` files to version control
- **Input Validation**: All API endpoints validate request parameters
- **Rate Limiting**: Recommended for production deployments
- **CORS**: Configure allowed origins in production
- **MongoDB**: Use authentication in production environments

---

## 🚧 Known Limitations

- **ML Model**: Trained on synthetic data, requires real-world training
- **Station Data**: Depends on OpenCharge API availability
- **Scalability**: Current architecture suitable for <1000 stations
- **Real-time Updates**: Uses polling, consider WebSockets for production

---

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Core scheduling and booking flow
- ✅ ML demand forecasting
- ✅ Self-healing agent framework
- ✅ Interactive map and digital twin

### Phase 2 (Planned)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-region grid coordination

### Phase 3 (Future)
- [ ] Blockchain-based energy credits
- [ ] V2G (Vehicle-to-Grid) integration
- [ ] Renewable energy optimization
- [ ] Predictive maintenance AI

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenCharge Map** for station data API
- **IEC 60076-7** for transformer thermal standards
- **TensorFlow** for ML framework
- **Leaflet** for mapping capabilities

---

## 📞 Support

For questions, issues, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Documentation**: See [API-DOCUMENTATION.md](Backend/API-DOCUMENTATION.md)
- **Email**: support@sentinel-ev.com

---

## 📈 Performance Metrics

- **API Response Time**: <200ms average
- **ML Prediction**: <100ms per forecast
- **Station Cache**: 5-minute TTL
- **Concurrent Users**: Tested up to 100
- **Database**: Handles 10K+ telemetry records/hour

---

**Built with ⚡ by the Sentinel EV Team**

*Preventing grid collapse, one smart charge at a time.*
