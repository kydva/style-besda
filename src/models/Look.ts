import { Document, Model, model, PopulatedDoc, Schema } from 'mongoose';
import { IPiece } from './Piece';
import { IUser } from './User';

export interface ILook {
    pieces: PopulatedDoc<Document & IPiece>[],
    gender: 'M' | 'F'
    season: 'Summer' | 'Winter' | 'Demi-season',
    img: string,
    author: PopulatedDoc<Document & IUser>,
    toJsonFor(user: IUser & Document): any
}

interface Query {
    limit: number,
    skip: number,
    favorites: boolean,
    season?: string,
    showDisliked?: boolean
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
    season: { type: String, enum: ['Summer', 'Winter', 'Demi-season'], required: [true, 'Please, select season'] },
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Please, select gender'] },
    img: { type: String, required: [true, 'Image is required'] },
    author: { type: 'ObjectId', ref: 'User', required: true }
});

function lookToJsonForUser(look: any, user?: IUser & Document) {
    const lookForUser = look instanceof Document ? look.toObject() : look;
    if (user) {
        lookForUser.pieces = lookForUser.pieces.map((piece: any) => {
            piece.inWardrobe = user.wardrobe.includes(piece._id);
            return piece;
        });
        lookForUser.isLiked = user.favorites.includes(look._id);
        lookForUser.isDisliked = user.hiddenLooks.includes(look._id);
        lookForUser.canDelete = user._id.equals(look.author) || user.isAdmin();
    }
    return lookForUser;
}

lookSchema.methods.toJsonFor = function (user: IUser & Document) {
    return lookToJsonForUser(this, user);
};

lookSchema.statics.findLooksFor = async function (user: IUser & Document, query: Query): Promise<{ looks: any[]; totalResults: number; }> {
    const match: any = {
        gender: user.gender,
        pieces: { $in: user.wardrobe }
    };

    if (query.season) {
        match.season = query.season;
    }

    if (query.favorites) {
        match._id = { $in: user.favorites };
    } else {
        match._id = query.showDisliked ? { $nin: user.favorites } : { $nin: [...user.favorites, ...user.hiddenLooks] };
    }

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
        }
    ]);

    const looksForUser = looks.map((look) => lookToJsonForUser(look, user));
    const totalResults = await Look.countDocuments(match);
    return { looks: looksForUser, totalResults };
};

export const Look = model<ILook, ILookModel>('Look', lookSchema);

