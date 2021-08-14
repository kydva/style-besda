declare namespace Express {
    export interface Request {
        user?: import('../models/User').IUser;
    }
}