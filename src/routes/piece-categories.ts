import { Router } from 'express';
import { isAdmin } from '../auth';
import { PieceCategory } from '../models/PieceCategory';

const router = Router();

router.post('/', isAdmin, async (req, res, next) => {
    try {
        const category = new PieceCategory({
            name: req.body.name,
            parent: req.body.parent ?? null
        });

        await category.save();

        res.status(201).send();
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

export default router;