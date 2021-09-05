import { Router } from 'express';
import { isAuthenticated } from '../utils/auth';
import { Piece } from '../models/Piece';

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

export default router;
