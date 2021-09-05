import { Types, Schema, model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IUser } from './User';

export interface IPiece {
    name: string,
    gender: 'M' | 'F',
    category: Types.ObjectId,
    img: string,
    toJsonFor(user: IUser): any
}

const pieceSchema = new Schema<IPiece>({
    name: { type: String, required: [true, 'Name cannot be empty'], unique: true },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    category: { type: 'ObjectId', ref: 'PieceCategory', required: [true, 'Please, choose a category'] },
    img: { type: String, required: [true, 'Image is required'] },
    __v: { type: Number, select: false }
});

pieceSchema.methods.toJsonFor = function (user: IUser) {
    return {
        _id: this._id,
        name: this.name,
        img: this.img,
        inWardrobe: user.wardrobe.includes(this._id)
    };
};

pieceSchema.plugin(uniqueValidator, { message: 'The piece with that name already exists' });

export const Piece = model<IPiece>('Piece', pieceSchema);