import { Router } from 'express';
import { isAuthenticated } from '../utils/auth';
import { Piece } from '../models/Piece';
import { Look } from '../models/Look';
import { validateOptionalImageMiddleware } from '../utils/validate-image';
import upload from '../utils/upload';
import * as s3 from '../utils/s3';
import { User } from '../models/User';

const router = Router();

router.get('/me', (req, res) => {
    res.send({ user: req.user || null });
});

router.patch('/me', upload.single('avatar'), validateOptionalImageMiddleware, async (req, res, next) => {
    try {
        if (req.file) {
            await s3.moveFileToBucket(req.file, 'users');
            req.user.avatar = req.file.filename;
            await req.user.save();
        }
        if (req.body.password || req.body.passwordConfirm || req.body.oldPassword) {
            const errors: any = {};
            if (!req.body.password) {
                errors.password = 'Enter a new password';
            }
            if (req.body.password !== req.body.passwordConfirm) {
                errors.passwordConfirm = 'Password is not confirmed';
            }
            if (!req.body.oldPassword) {
                errors.oldPassword = 'You must enter your old password';
            }
            const match = await req.user.comparePassword(req.body.oldPassword);
            if (!match) {
                errors.oldPassword = 'Password is incorrect';
            }
            if (Object.keys(errors).length !== 0) {
                return res.status(400).send({ errors });
            }

            req.user.password = req.body.password;
            await req.user.save();

        }

        if (req.body.name) {
            req.user.name = req.body.name;
            await req.user.save();
        }

        return res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('looks', ['_id', 'img']);
        if (!user) {
            res.sendStatus(404);
        }
        res.send({user});
    } catch (e) {
        next(e);
    }
});

router.param('piece', async (req, res, next, pieceId) => {
    try {
        const piece = await Piece.exists({ _id: pieceId });
        if (!piece) {
            return res.sendStatus(404);
        }
        next();
    } catch (e) {
        next(e);
    }
});

router.param('look', async (req, res, next, lookId) => {
    try {
        const look = await Look.exists({ _id: lookId });
        if (!look) {
            return res.sendStatus(404);
        }
        next();
    } catch (e) {
        next(e);
    }
});

router.put('/me/wardrobe/:piece', isAuthenticated, async (req, res, next) => {
    try {
        req.user.addToWardrobe(req.params.piece);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.delete('/me/wardrobe/:piece', isAuthenticated, async (req, res, next) => {
    try {
        req.user.removeFromWardrobe(req.params.piece);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.put('/me/favorites/:look', isAuthenticated, async (req, res, next) => {
    try {
        req.user.addToFavorites(req.params.look);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.delete('/me/favorites/:look', isAuthenticated, async (req, res, next) => {
    try {
        req.user.removeFromFavorites(req.params.look);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.put('/me/hidden-looks/:look', isAuthenticated, async (req, res, next) => {
    try {
        req.user.hideLook(req.params.look);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.delete('/me/hidden-looks/:look', isAuthenticated, async (req, res, next) => {
    try {
        req.user.unhideLook(req.params.look);
        await req.user.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});


export default router;
