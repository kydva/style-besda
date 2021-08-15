import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import cors from 'cors';
import router from './routes';
import * as auth from './auth';
import errorHandler from './error-handler';


const app = express();

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).catch((e) => {
    console.log(`Mongoose connection error: ${e}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
}));
app.use(auth.sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());


app.use(router);

app.use(errorHandler);

export default app;