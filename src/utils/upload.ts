import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: 'tmp/',
    filename(req, file, cb) {
        const random = Math.round(Math.random() * 1000);
        const extension = path.extname(file.originalname);
        cb(null, Date.now() + '-' + random + extension);
    }
});

const upload = multer({ storage });

export default upload;