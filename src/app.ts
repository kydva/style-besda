import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import apiRouter from './routes';
import imagesRouter from './routes/images';
import * as auth from './utils/auth';
import errorHandler from './utils/error-handler';
import logger from './utils/logger';

const app = express();

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).catch((e) => {
    console.log('Mongoose connection error: ' + e);
    logger.error('Mongoose connection error: ' + e);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN,
    credentials: true
}));
app.use(helmet());
app.use(auth.sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/v1', apiRouter);
app.use(imagesRouter);
app.use(errorHandler);

export default app;