import { Router } from 'express';
import passport from 'passport';
import { User } from '../models/User';

import '../auth';

const router = Router();

router.post('/login', passport.authenticate('local'), (req, res) => {
    res.send({ user: req.user });
});

router.get('/me', (req, res) => {
    res.send({ user: req.user || null });
});

router.get('/logout', (req, res) => {
    req.logout();
    res.end();
});

router.post('/register', (async (req, res, next) => {
    try {
        if (req.body.password !== req.body.passwordConfirm) {
            res.status(400).send({
                errors: {
                    passwordConfirm: 'Password is not confirmed'
                }
            });
        }

        const user = new User({
            name: req.body.name,
            password: req.body.password
        });
        await user.save();
        
        req.login(user, (err) => {
            if (err) throw err;
        });
        res.sendStatus(201);
    } catch (e) {
        next(e);
    }
}));

export default router;