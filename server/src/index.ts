// ============================================
// Sewanya iPhone — Express Server Entry Point
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/index.js';
import { requireAuth } from './middleware/auth.js';

// Route imports
import iphoneRoutes from './routes/iphone.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import userRoutes from './routes/user.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import logRoutes from './routes/log.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============ Global Middleware ============

app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'http://localhost:3000',
    ],
    credentials: true, // Required for Better Auth cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());

// ============ Better Auth Routes ============
// Must be mounted BEFORE express.json() and requireAuth
// Better Auth handles its own body parsing

app.all('/api/auth/{*splat}', toNodeHandler(auth));

// ============ Body Parser ============
// Applied after auth routes so Better Auth can handle its own parsing

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ Health Check ============

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sewanya-iphone-api',
  });
});

// ============ Protected API Routes ============
// All routes below require authentication

app.use('/api/iphones', requireAuth, iphoneRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/pricing', requireAuth, pricingRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/logs', requireAuth, logRoutes);

// ============ 404 Handler ============

app.use('/api/{*splat}', (_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ============ Global Error Handler ============

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Terjadi kesalahan internal'
          : err.message,
    });
  }
);

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🍎 Sewanya iPhone API Server          ║
║   Running on http://localhost:${PORT}       ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
