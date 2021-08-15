import { Document, model, PopulatedDoc, Schema } from 'mongoose';

export interface IPieceCategory {
    name: string,
    parent?: PopulatedDoc<IPieceCategory & Document>,
    children: PopulatedDoc<IPieceCategory & Document>[]
}

const pieceCategorySchema = new Schema<IPieceCategory>({
    name: { type: String, required: true },
    parent: { type: 'ObjectId', ref: 'PieceCategory' },
    children: [{ type: 'ObjectId', ref: 'PieceCategory' },]
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

export const PieceCategory = model<IPieceCategory>('PieceCategory', pieceCategorySchema);