import { ErrorRequestHandler } from 'express';
import logger from './logger';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logger.error(err);
    if (err.name === 'ValidationError') {
        const errors: { [field: string]: { message: string } } = {};
        for (const field in err.errors) {
            errors[field] = err.errors[field].message;
        }
        res.status(400).send({ errors });
    } else next(err);
};

export default errorHandler;
