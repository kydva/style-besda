import { Router } from 'express';
import * as s3 from '../utils/s3';
import authRouter from './auth';
import categoriesRouter from './piece-categories';
import piecesRouter from './pieces';
import usersRouter from './users';

const router = Router();

router.use(authRouter);
router.use('/users', usersRouter);
router.use('/piece-categories', categoriesRouter);
router.use('/pieces', piecesRouter);
router.get('/img/:name(*)', async (req, res) => {
    const data = await s3.getFile(req.params.name);
    if (data) {
        res.setHeader('Cache-Control', 'max-age=' + 365 * 24 * 60 * 60);
        data.pipe(res);
    } else res.sendStatus(404);
});

export default router;