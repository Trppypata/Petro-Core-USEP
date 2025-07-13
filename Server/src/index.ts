// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debug environment variables
console.log('Environment loaded: NODE_ENV =', process.env.NODE_ENV);
console.log('API running at port:', process.env.PORT || 8001);

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studentRoutes from './routes/student.routes';
import userRoutes from './routes/users.routes';
import mineralsRoutes from './routes/minerals.routes';
import rocksRoutes from './routes/rocks.routes';
import rockImagesRoutes from './routes/rock-images.routes';
import { setupStorageBuckets } from './config/setup-storage';

// Create Express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://petro-core-usep.onrender.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/minerals', mineralsRoutes);
app.use('/api/rocks', rocksRoutes);
app.use('/api/rock-images', rockImagesRoutes);



// Initialize Supabase storage buckets
setupStorageBuckets().catch(err => {
  console.error('Error setting up storage buckets:', err);
});

app.use(express.static('build'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 