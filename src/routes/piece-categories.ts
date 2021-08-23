import { Router } from 'express';
import { isAdmin } from '../auth';
import { PieceCategory } from '../models/PieceCategory';

const router = Router();

router.param('category', async function (req, res, next, categoryId) {
    const category = await PieceCategory.findById(categoryId);
    if (!category) {
        return res.sendStatus(404);
    }
    req.category = category;
    next();
});

router.get('/', async (req, res, next) => {
    const categoriesTree = await PieceCategory.getTree();
    res.send({ categories: categoriesTree });
});

router.post('/', isAdmin, async (req, res, next) => {
    try {
        const category = new PieceCategory({
            name: req.body.name,
            parent: req.body.parent ?? null
        });
        await category.save();
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

router.patch('/:category', isAdmin, async (req, res, next) => {
    try {
        await req.category.update({ $set: { name: req.body.name } }, { runValidators: true, context: 'query' });
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

router.delete('/:category', isAdmin, async (req, res, next) => {
    await req.category.delete();
    res.sendStatus(204);
});

export default router;