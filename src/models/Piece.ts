import { Types, Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IPiece {
    name: string,
    gender?: 'M' | 'F',
    category: Types.ObjectId,
    img: string
}

const PieceSchema = new Schema<IPiece>({
    name: { type: String, required: [true, 'Name cannot be empty'], unique: true },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    category: { type: 'ObjectId', ref: 'PieceCategory', required: [true, 'Please, choose a category'] },
    img: { type: String, required: [true, 'Image is required'] },
    __v: { type: Number, select: false }
});

PieceSchema.plugin(uniqueValidator, { message: 'The piece with that name already exists' });

export const Piece = model<IPiece>('Piece', PieceSchema);