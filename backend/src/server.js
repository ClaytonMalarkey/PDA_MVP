const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDatabase = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || '196.75.153.172:5173',
    '196.75.153.172:5174' // Admin dashboard
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const { apiLimiter } = require('./middleware/rateLimit');
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');
const empireRoutes = require('./routes/empire');
const leaderboardRoutes = require('./routes/leaderboard');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/categories');
const researchRoutes = require('./routes/research');
const civilizationRoutes = require('./routes/civilization');
// const aiTaskRoutes = require('./routes/aiTasks');

// API Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Public Deindoctrination App API',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/empire', empireRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/civilizations', civilizationRoutes);

const gameplayRoutes = require('./routes/gameplay');
app.use('/api/gameplay', gameplayRoutes);

const shopRoutes = require('./routes/shop');
app.use('/api/shop', shopRoutes);

const socialRoutes = require('./routes/social');
app.use('/api/social', socialRoutes);

const genTaskRoutes = require('./routes/generatedTasks');
app.use('/api/gen-tasks', genTaskRoutes);

const jobRoutes = require('./routes/jobs');
app.use('/api/jobs', jobRoutes);

const gameConfigRoutes = require('./routes/gameConfig');
app.use('/api/game-config', gameConfigRoutes);

const expansionRoutes = require('./routes/expansion');
app.use('/api/expansion', expansionRoutes);

const identityRoutes = require('./routes/identity');
app.use('/api/identity', identityRoutes);

const monetizationRoutes = require('./routes/monetization');
app.use('/api/monetization', monetizationRoutes);

const checkoutRoutes = require('./routes/checkout');
app.use('/api/checkout', checkoutRoutes);

const nodeRoutes = require('./routes/nodes');
app.use('/api/nodes', nodeRoutes);

const pluginRoutes = require('./routes/plugins');
app.use('/api/plugins', pluginRoutes);

const feedRoutes = require('./routes/feed');
app.use('/api/feed', feedRoutes);

const worldRoutes = require('./routes/world');
app.use('/api/world', worldRoutes);

const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);
// app.use('/api/ai', aiTaskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to database and start server
const PORT = process.env.PORT || 5000;
const http = require('http');
const socketManager = require('./services/socketManager');

connectDatabase()
  .then(() => {
    const httpServer = http.createServer(app);
    const io = socketManager.init(httpServer);
    app.set('io', io); // Make io accessible in routes via req.app.get('io')

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: 196.75.153.172:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

module.exports = app;
