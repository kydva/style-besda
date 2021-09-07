import { model, PopulatedDoc, Schema, Types } from 'mongoose';
import { IPiece } from './Piece';
import { IUser } from './User';

export interface ILook {
    pieces: PopulatedDoc<Document & IPiece>[],
    gender: 'M' | 'F'
    img: string,
    author: PopulatedDoc<Document & IUser>
}

const lookSchema = new Schema<ILook>({
    pieces: {
        type: [{ type: 'ObjectId', ref: 'Piece' }],
        validate: [(pieces: Types.ObjectId[]) => pieces.length >= 2, 'The look must consist of at least two pieces']
    },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    img: { type: String, required: [true, 'Image is required'] },
    author: { type: 'ObjectId', ref: 'User', required: true }
});

export const Look = model<ILook>('Look', lookSchema);

