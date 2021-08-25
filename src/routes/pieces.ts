import { Router } from 'express';
import { isAdmin } from '../auth';
import { Piece } from '../models/Piece';

const router = Router();

router.param('piece', async (req, res, next, pieceId) => {
    const piece = await Piece.findById(pieceId);
    if (!piece) {
        return res.sendStatus(404);
    }
    req.piece = piece;
    next();
});

router.post('/', isAdmin, async (req, res, next) => {
    try {
        const piece = new Piece({
            name: req.body.name,
            gender: req.body.gender,
            category: req.body.category
        });
        await piece.save();
        res.sendStatus(201);
    } catch (e) {
        if (e.name === 'ValidationError') {
            const errors: { [field: string]: { message: string } } = {};
            for (const field in e.errors) {
                errors[field] = e.errors[field].message;
            }
            res.status(400).send({ errors });
        } else next(e);
    }
});

router.get('/', async (req, res) => {
    const limit = +(req.query.limit ?? 20);
    const skip = +(req.query.skip ?? 0);
    const pieces = await Piece.find().limit(limit).skip(skip);
    const total = await Piece.countDocuments();

    res.send({
        pieces,
        limit,
        skip,
        total
    });
});

router.patch('/:piece', isAdmin, async (req, res, next) => {
    const fieldsForUpdate = ['name', 'gender', 'category'] as const;
    fieldsForUpdate.forEach((field) => {
        if (typeof req.body[field] !== 'undefined') {
            req.piece[field] = req.body[field];
        }
    });

    try {
        await req.piece.save();
        res.sendStatus(204);
    } catch (e) {
        if (e.name === 'ValidationError') {
            const errors: { [field: string]: { message: string } } = {};
            for (const field in e.errors) {
                errors[field] = e.errors[field].message;
            }
            res.status(400).send({ errors });
        } else next(e);
    }
});

router.delete('/:piece', isAdmin, async (req, res) => {
    await req.piece.delete();
    res.sendStatus(204);
});

export default router;