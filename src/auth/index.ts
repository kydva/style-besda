import passport from 'passport';
import { User } from '../models/User';
import PassportLocal from 'passport-local';
import redisClient from '../redis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { RequestHandler } from 'express';

passport.serializeUser(((user: any, done) => {
    done(undefined, user._id);
}));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (e) {
        done(e);
    }
});

passport.use(new PassportLocal.Strategy({
    usernameField: 'name',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        const user = await User.findOne({ name: username });
        if (!user) return done(undefined, false);
        const match = await user.comparePassword(password);
        if (!match) return done(undefined, false);

        return done(undefined, user);
    } catch (e) {
        return done(e);
    }
}));

const RedisStore = connectRedis(session);

export const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 10 * 60 * 1000,
        httpOnly: false,
    }
});

export const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else res.status(401).send();
};