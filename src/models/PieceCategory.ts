import { Document, model, PopulatedDoc, Schema, Model } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IPieceCategory {
    name: string,
    gender: 'M' | 'F',
    parent?: PopulatedDoc<IPieceCategory & Document>,
    children: PopulatedDoc<IPieceCategory & Document>[],
    ancestors: PopulatedDoc<IPieceCategory & Document>[],
}

interface IPieceCategoryModel extends Model<IPieceCategory> {
    getTree(): any
}

const pieceCategorySchema = new Schema<IPieceCategory, IPieceCategoryModel>({
    name: { type: String, required: [true, 'Category name cannot be empty'], unique: true },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    parent: { type: 'ObjectId', ref: 'PieceCategory' },
    children: [{ type: 'ObjectId', ref: 'PieceCategory' },],
    ancestors: [{ type: 'ObjectId', ref: 'PieceCategory' }],
    __v: { type: Number, select: false }
});

pieceCategorySchema.plugin(uniqueValidator, { message: 'Name must be unique' });

pieceCategorySchema.pre('save', async function (next) {
    if (this.isModified('parent') && this.parent) {
        const parent = await PieceCategory.findById(this.parent);
        parent.children.push(this._id);
        await parent.save();
        this.ancestors = [...parent.ancestors, this.parent];
    }
    next();
});

pieceCategorySchema.pre('remove', async function (next) {
    //Remove children
    PieceCategory.deleteMany({ parent: this._id }).exec();
    //Remove reference in parent category
    if (this.parent) {
        const parent = await PieceCategory.findById(this.parent);
        parent.children.filter((childId) => {
            return childId !== this._id;
        });
    }
    next();
});

pieceCategorySchema.statics.getTree = async function () {
    return await this.find({ parent: null }).populate({ path: 'children', populate: { path: 'children' } });
};

export const PieceCategory = model<IPieceCategory, IPieceCategoryModel>('PieceCategory', pieceCategorySchema);