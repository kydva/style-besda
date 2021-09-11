import { Model, model, PopulatedDoc, Schema } from 'mongoose';
import { IPiece } from './Piece';
import { IUser } from './User';

export interface ILook {
    pieces: PopulatedDoc<Document & IPiece>[],
    gender: 'M' | 'F'
    img: string,
    author: PopulatedDoc<Document & IUser>
}

interface Query {
    limit: number,
    skip: number,
    favorites: boolean,
}

interface ILookModel extends Model<ILook> {
    findLooksFor(user: IUser, query: Query): ILook[]
}

const lookSchema = new Schema<ILook, ILookModel>({
    pieces: {
        type: [{ type: 'ObjectId', ref: 'Piece' }],
        validate: [(pieces: any[]) => pieces.length >= 2, 'The look must consist of at least two pieces'],
        required: [true, 'Please, select pieces']
    },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Please, select gender'] },
    img: { type: String, required: [true, 'Image is required'] },
    author: { type: 'ObjectId', ref: 'User', required: true }
});

lookSchema.statics.findLooksFor = async function (user: IUser, query: Query): Promise<{ looks: any[]; totalResults: number; }> {
    const match = {
        _id: query.favorites ? { $in: user.favorites, $nin: user.hiddenLooks } : { $nin: [...user.favorites, ...user.hiddenLooks] },
        gender: user.gender,
        pieces: { $in: user.wardrobe }
    };

    const looks = await Look.aggregate([
        { $match: match },
        { $set: { variance: { $size: { $setDifference: ['$pieces', user.wardrobe] } } } },
        { $sort: { variance: 1, _id: 1 } },
        { $skip: query.skip },
        { $limit: query.limit },
        {
            $lookup:
            {
                from: 'pieces',
                localField: 'pieces',
                foreignField: '_id',
                as: 'pieces'
            }
        },
        {
            $lookup:
            {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author'
            }
        }
    ]);

    const looksForUser = looks.map((look) => {
        look.author = look.author[0];
        look.pieces = look.pieces.map((piece: any) => {
            piece.inWardrobe = user.wardrobe.includes(piece._id);
            return piece;
        });
        return look;
    });

    const totalResults = await Look.countDocuments(match);
    return { looks: looksForUser, totalResults };
};

export const Look = model<ILook, ILookModel>('Look', lookSchema);

