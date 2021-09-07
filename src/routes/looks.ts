import { Router } from 'express';
import { isAuthenticated } from '../utils/auth';
import upload from '../utils/upload';
import validateImageMiddleware from '../utils/validate-image';
import * as s3 from '../utils/s3';
import { Look } from '../models/Look';


const router = Router();

router.post('/', isAuthenticated, upload.single('img'), validateImageMiddleware, async (req, res, next) => {
    try {
        const look = new Look({
            pieces: req.body.pieces,
            gender: req.body.gender,
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
        const looks = await Look.aggregate([
            { $match: { gender: req.user.gender, pieces: { $in: req.user.wardrobe } } },
            { $project: { variance: { $size: { $setDifference: ['$pieces', req.user.wardrobe] } } } },
            { $sort: { variance: 1 } }
        ]);
        res.send({ looks });
    } catch (e) {
        next(e);
    }

});

export default router;