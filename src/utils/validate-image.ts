import { RequestHandler } from 'express';

const allowedTypes = ['image/jpeg', 'image/png'];

export const validateOptionalImageMiddleware: RequestHandler = (req, res, next) => {
    try {
        if (req.file && !allowedTypes.includes(req.file.mimetype)) {
            return res.status(415).send({ errors: { img: 'Unsupported image type. Supported extensions: png, jpg, jpeg' } });
        }
        next();
    } catch (e) {
        next(e);
    }
};

export const validateImageMiddleware: RequestHandler = (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).send({ errors: { img: 'Image is required' } });
        }
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(415).send({ errors: { img: 'Unsupported image type. Supported extensions: png, jpg, jpeg' } });
        }
        next();
    } catch (e) {
        next(e);
    }
};
