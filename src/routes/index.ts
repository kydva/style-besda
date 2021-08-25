import { Router } from 'express';
import authRouter from './auth';
import categoriesRouter from './piece-categories';
import piecesRouter from './pieces';

const router = Router();

router.use(authRouter);
router.use('/piece-categories', categoriesRouter);
router.use('/pieces', piecesRouter);

export default router;