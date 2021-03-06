import { Router } from 'express';
import { isAuthenticated } from '../utils/auth';
import upload from '../utils/upload';
import { validateImageMiddleware } from '../utils/validate-image';
import * as s3 from '../utils/s3';
import { Look } from '../models/Look';


const router = Router();

router.post('/', isAuthenticated, upload.single('img'), validateImageMiddleware, async (req, res, next) => {
    try {
        const look = new Look({
            pieces: req.body.pieces ? req.body.pieces.split(',') : null,
            gender: req.body.gender,
            season: req.body.season,
            img: req.file.filename,
            author: req.user._id
        });
        await look.validate();
        //If validation error is not thrown, upload the image to s3
        await s3.moveFileToBucket(req.file, 'looks');
        await look.save();
        res.sendStatus(201);
    } catch (e) {
        next(e);
    }
});

router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const query = {
            limit: +(req.query.limit ?? 15),
            skip: +(req.query.skip ?? 0),
            season: req.query.season?.toString(),
            showDisliked: req.query.showDisliked === 'true',
            favorites: req.query.favorites === 'true'
        };
        const results = await Look.findLooksFor(req.user, query);
        res.send(results);
    } catch (e) {
        next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const look = await Look.findById(req.params.id).populate(['author', 'pieces']);
        if (!look) {
            return res.sendStatus(404);
        }
        res.send({ look: look.toJsonFor(req.user) });
    } catch (e) {
        next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const look = await Look.findById(req.params.id);
        if (look == null) {
            return res.sendStatus(404);
        }
        if (!look.author._id.equals(req.user._id) && !req.user.isAdmin()) {
            return res.sendStatus(403);
        }
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

export default router;
