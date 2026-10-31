import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import addressRoutes from './routes/addresses.routes.js';
import purchaseRoutes from './routes/purchases.routes.js';
import documentRoutes from './routes/documents.routes.js';
import warrantyRoutes from './routes/warranties.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import reminderRoutes from './routes/reminders.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bez logowania
app.use('/api/auth', authRoutes);

// Wymagają tokenu JWT
app.use('/api/addresses', requireAuth, addressRoutes);
app.use('/api/purchases/:id/documents', requireAuth, documentRoutes);
app.use('/api/purchases', requireAuth, purchaseRoutes);
app.use('/api/warranties', requireAuth, warrantyRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);
app.use('/api/reminders', requireAuth, reminderRoutes);
app.use('/api/stats', requireAuth, statsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Nie ma takiego endpointu' } });
});

app.use(errorHandler);

export default app;
