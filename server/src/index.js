import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

if (process.env.MONGODB_URI) {
  await connectDB(process.env.MONGODB_URI);
} else {
  console.warn('Brak MONGODB_URI w .env — serwer działa bez bazy danych.');
}

app.listen(PORT, () => {
  console.log(`API działa: http://localhost:${PORT}/api`);
});
