import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../utils/auth';
import { IPiece, Piece } from '../models/Piece';
import * as s3 from '../utils/s3';
import upload from '../utils/upload';
import { FilterQuery } from 'mongoose';
import { PieceCategory } from '../models/PieceCategory';

const router = Router();

router.param('piece', async (req, res, next, pieceId) => {
    try {
        const piece = await Piece.findById(pieceId);
        if (!piece) {
            return res.sendStatus(404);
        }
        req.piece = piece;
        next();
    } catch (e) {
        next(e);
    }
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
        await s3.moveFileToBucket(req.file, 'pieces');
        await piece.save();
        res.sendStatus(201);
    } catch (e) {
        next(e);
    }
});

router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const searchQuery = req.query.searchQuery as string ?? null;
        const categories = req.query.categories as string[] ?? null;
        const limit = +(req.query.limit ?? 20);
        const skip = +(req.query.skip ?? 0);

        const query: FilterQuery<IPiece> = {gender: req.user.gender};

        if (req.query.inWardrobe && req.query.inWardrobe === 'true') {
            query._id = { $in: req.user.wardrobe };
        }
        if (searchQuery && searchQuery !== '') {
            query.name = new RegExp(searchQuery, 'i');
        }
        if (categories && categories.length > 0) {
            const childCategories = await PieceCategory.find({ ancestors: { $in: req.query.categories } }).distinct('_id');
            const matchedCategories = childCategories.concat(req.query.categories);
            query.category = { $in: matchedCategories };
        }

        const pieces = await Piece.find(query).limit(limit).skip(skip);
        const totalResults = await Piece.countDocuments(query);

        const piecesForUser = pieces.map((piece) => {
            return piece.toJsonFor(req.user);
        });

        res.send({
            pieces: piecesForUser,
            totalResults
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
