import { Types, Schema, model } from 'mongoose';
import { Look } from './Look';
import { IUser } from './User';

export interface IPiece {
    name: string,
    gender: 'M' | 'F',
    category: Types.ObjectId,
    img: string,
    toJsonFor(user: IUser): any
}

const pieceSchema = new Schema<IPiece>({
    name: { type: String, required: [true, 'Name cannot be empty'] },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    category: { type: 'ObjectId', ref: 'PieceCategory', required: [true, 'Please, choose a category'] },
    img: { type: String, required: [true, 'Image is required'] },
    __v: { type: Number, select: false }
});

pieceSchema.index({ 'name': 1, 'gender': 1 }, { unique: true });

pieceSchema.path('name').validate(async function () {
    const count = await Piece.countDocuments({ name: this.name, gender: this.gender });
    return !count;
}, 'Err');

pieceSchema.methods.toJsonFor = function (user: IUser) {
    return {
        _id: this._id,
        name: this.name,
        img: this.img,
        inWardrobe: user.wardrobe.includes(this._id)
    };
};

pieceSchema.pre('remove', async function (next) {
    const relatedLooks = await Look.find({ pieces: this._id });
    relatedLooks.forEach((look) => look.delete());
    next();
});

export const Piece = model<IPiece>('Piece', pieceSchema);