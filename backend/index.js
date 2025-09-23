//backend/index.js

import express from 'express';
import authRoutes from './routes/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Mount authentication routes
app.use('/api', authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
