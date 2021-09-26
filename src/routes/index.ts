import { Router } from 'express';
import authRouter from './auth';
import categoriesRouter from './piece-categories';
import piecesRouter from './pieces';
import usersRouter from './users';
import looksRouter from './looks';

const router = Router();

router.use(authRouter);
router.use('/users', usersRouter);
router.use('/piece-categories', categoriesRouter);
router.use('/pieces', piecesRouter);
router.use('/looks', looksRouter);

export default router;