//backend/index.js

import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import loginRoutes from './routes/login.js';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());

// Mount routes
app.use('/api', authRoutes);
app.use('/api', loginRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
