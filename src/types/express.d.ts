import { IUser } from '../models/User';
import { IPieceCategory } from '../models/PieceCategory';
import { Document } from 'mongoose';


declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends IUser { }
    interface Request {
      category?: IPieceCategory & Document
    }
  }
}