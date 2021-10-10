import { Document, model, PopulatedDoc, Schema, Model, FilterQuery } from 'mongoose';

export interface IPieceCategory {
    name: string,
    gender: 'M' | 'F',
    parent?: PopulatedDoc<IPieceCategory & Document>,
    children: PopulatedDoc<IPieceCategory & Document>[],
    ancestors: PopulatedDoc<IPieceCategory & Document>[],
}

interface IPieceCategoryModel extends Model<IPieceCategory> {
    getTree(filter: FilterQuery<IPieceCategory>): any
}

const pieceCategorySchema = new Schema<IPieceCategory, IPieceCategoryModel>({
    name: { type: String, required: [true, 'Category name cannot be empty'], unique: true },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    parent: { type: 'ObjectId', ref: 'PieceCategory' },
    children: [{ type: 'ObjectId', ref: 'PieceCategory' },],
    ancestors: [{ type: 'ObjectId', ref: 'PieceCategory' }],
    __v: { type: Number, select: false }
});

pieceCategorySchema.index({ 'name': 1, 'gender': 1 }, { unique: true });

pieceCategorySchema.pre('save', async function (next) {
    if (this.isModified('name')) {
        const count = await PieceCategory.countDocuments({ name: this.name, gender: this.gender });
        if (count) {
            const validationErr = this.invalidate('name', 'Name must be unique');
            return next(validationErr);
        }
    }

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

pieceCategorySchema.statics.getTree = async function (filter: FilterQuery<IPieceCategory>) {
    return await this.find({ parent: null, ...filter }).populate({ path: 'children', populate: { path: 'children' } });
};

export const PieceCategory = model<IPieceCategory, IPieceCategoryModel>('PieceCategory', pieceCategorySchema);