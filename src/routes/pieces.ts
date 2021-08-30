import { Router } from 'express';
import { isAdmin } from '../utils/auth';
import { Piece } from '../models/Piece';
import * as s3 from '../utils/s3';
import upload from '../utils/upload';

const router = Router();

router.param('piece', async (req, res, next, pieceId) => {
    const piece = await Piece.findById(pieceId);
    if (!piece) {
        return res.sendStatus(404);
    }
    req.piece = piece;
    next();
});

router.post('/', isAdmin, upload.single('img'), async (req, res, next) => {
    try {
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (!req.file) {
            return res.status(400).send({ errors: { img: 'Image is required' } });
        }

        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(415).send({ errors: { img: 'Unsupported image type. Supported extensions: png, jpg, jpeg' } });
        }

        const piece = new Piece({
            name: req.body.name,
            gender: req.body.gender,
            category: req.body.category,
            img: req.file.filename
        });

        await piece.validate();

        //If validation error is not thrown, upload the image to s3
        await s3.moveFileToBucket(req.file);
        await piece.save();
        res.sendStatus(201);
    } catch (e) {
        next(e);
    }
});

router.get('/', async (req, res, next) => {
    try {
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
    } catch (e) {
        next(e);
    }
});

router.patch('/:piece', isAdmin, async (req, res, next) => {
    try {
        const fieldsForUpdate = ['name', 'gender', 'category'] as const;
        fieldsForUpdate.forEach((field) => {
            if (typeof req.body[field] !== 'undefined') {
                req.piece[field] = req.body[field];
            }
        });

        await req.piece.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.delete('/:piece', isAdmin, async (req, res, next) => {
    try {
        await req.piece.delete();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

export default router;