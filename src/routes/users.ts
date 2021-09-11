import { Router } from 'express';
import { isAuthenticated } from '../utils/auth';
import { Piece } from '../models/Piece';
import { Look } from '../models/Look';

const router = Router();

router.get('/me', (req, res) => {
    res.send({ user: req.user || null });
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
