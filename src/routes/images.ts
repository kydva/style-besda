import {Router} from 'express';
import * as s3 from '../utils/s3';

const router = Router();

router.get('/img/:name(*)', async (req, res) => {
    const data = await s3.getFile(req.params.name);
    if (data) {
        res.setHeader('Cache-Control', 'max-age=' + 365 * 24 * 60 * 60);
        data.pipe(res);
    } else res.sendStatus(404);
});

export default router;