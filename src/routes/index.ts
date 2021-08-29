import { Router } from 'express';
import * as s3 from '../utils/s3';
import authRouter from './auth';
import categoriesRouter from './piece-categories';
import piecesRouter from './pieces';

const router = Router();

router.use(authRouter);
router.use('/piece-categories', categoriesRouter);
router.use('/pieces', piecesRouter);
router.get('/img/:name', async (req, res) => {
    const data = await s3.getFile(req.params.name);
    if (data) {
        data.pipe(res);
    } else res.sendStatus(404);
});

export default router;