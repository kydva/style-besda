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
    try {
        const categoriesTree = await PieceCategory.getTree();
        res.send({ categories: categoriesTree });
    } catch (e) {
        next(e);
    }
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
        next(e);
    }
});

router.patch('/:category', isAdmin, async (req, res, next) => {
    try {
        const fieldsForUpdate = ['name'] as const;
        fieldsForUpdate.forEach((field) => {
            if (typeof req.body[field] !== 'undefined') {
                req.category[field] = req.body[field];
            }
        });
        await req.category.save();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

router.delete('/:category', isAdmin, async (req, res, next) => {
    try {
        await req.category.delete();
        res.sendStatus(204);
    } catch (e) {
        next(e);
    }
});

export default router;