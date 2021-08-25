import { Document } from 'mongoose';
import { IUser } from '../models/User';
import { IPieceCategory } from '../models/PieceCategory';
import { IPiece } from 'src/models/Piece';


declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends IUser { }
    interface Request {
      category?: IPieceCategory & Document,
      piece?: IPiece & Document;
    }
  }
}