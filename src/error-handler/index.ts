import { ErrorRequestHandler } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'errors.log' })
    ]
});


const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    logger.error(err);
    next(err);
};

export default errorHandler;
