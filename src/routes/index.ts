import { Router } from 'express';
import authRouter from './auth';
import categoriesRouter from './piece-categories';

const router = Router();

router.use(authRouter);
router.use('/piece-categories', categoriesRouter);

export default router;