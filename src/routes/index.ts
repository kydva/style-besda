import { Router } from 'express';
import authRouter from './auth';
import categoriesRouter from './categories';

const router = Router();

router.use(authRouter);
router.use('/categories', categoriesRouter);

export default router;