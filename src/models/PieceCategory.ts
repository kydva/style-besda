import { Document, model, PopulatedDoc, Schema, Model } from 'mongoose';

export interface IPieceCategory {
    name: string,
    parent?: PopulatedDoc<IPieceCategory & Document>,
    children: PopulatedDoc<IPieceCategory & Document>[]
}

interface IPieceCategoryModel extends Model<IPieceCategory> {
    getTree(): any
}


const pieceCategorySchema = new Schema<IPieceCategory, IPieceCategoryModel>({
    name: { type: String, required: true },
    parent: { type: 'ObjectId', ref: 'PieceCategory' },
    children: [{ type: 'ObjectId', ref: 'PieceCategory' },],
    __v: { type: Number, select: false }
});

pieceCategorySchema.pre('save', async function (next) {
    const category = this as IPieceCategory & Document;
    if (category.isModified('parent') && category.parent) {
        const parent = await PieceCategory.findById(category.parent);
        parent.children.push(category._id);
        await parent.save();
    }
    next();
});

pieceCategorySchema.statics.getTree = async function () {
    return await this.find({ parent: null }).populate({ path: 'children', populate: { path: 'children' } });
};

export const PieceCategory = model<IPieceCategory, IPieceCategoryModel>('PieceCategory', pieceCategorySchema);