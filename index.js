import express from 'express';
import dotenv from 'dotenv';  

import connectToMongoDB from './db/mongodb.js';

import userRoutes from './routes/user.routes.js';


dotenv.config();
connectToMongoDB();

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
    });