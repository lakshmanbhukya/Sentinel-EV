require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const powerRoutes = require('./routes/powerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mlRoutes = require('./routes/mlRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const gridRoutes = require('./routes/gridRoutes');
const reportRoutes = require('./routes/reportRoutes');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/power', powerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/forecast', mlRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/grid', gridRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'EV Charging Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI}`);
  console.log(`🤖 Flask ML Service: ${process.env.FLASK_ML_SERVICE_URL}`);
});
