import express from 'express';
import dotenv from 'dotenv';  

import connectToMongoDB from './db/mongodb.js';


dotenv.config();
connectToMongoDB();

const app = express();

app.use(express.json());

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
    });