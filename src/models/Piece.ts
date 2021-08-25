import { Types, Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IPiece {
    name: string,
    gender?: 'M' | 'F',
    category: Types.ObjectId
}

const PieceSchema = new Schema<IPiece>({
    name: { type: String, required: [true, 'Name cannot be empty'], unique: true },
    gender: { type: String, enum: ['M', 'F'] },
    category: { type: 'ObjectId', ref: 'PieceCategory', required: [true, 'Please, choose a category'] },
    __v: { type: Number, select: false }
});

PieceSchema.plugin(uniqueValidator, { message: 'The piece with that name already exists' });

export const Piece = model<IPiece>('Piece', PieceSchema);