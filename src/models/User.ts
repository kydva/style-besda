import { Document, model, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';

export interface IUser {
    name: string,
    password: string
    avatar?: string,
    gender: 'M' | 'F',
    roles: string[]
    wardrobe: Types.ObjectId[]
    favorites: Types.ObjectId[]
    hiddenLooks: Types.ObjectId[]
    comparePassword(candidatePassword: string): Promise<boolean>
    isAdmin(): boolean
    addToWardrobe(piece: string | Types.ObjectId): void
    removeFromWardrobe(piece: string | Types.ObjectId): void
    addToFavorites(look: string | Types.ObjectId): void
    removeFromFavorites(look: string | Types.ObjectId): void
    hideLook(look: string | Types.ObjectId): void
    unhideLook(look: string | Types.ObjectId): void

}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        unique: [true, 'Username must be unique'],
        required: [true, 'Username is required'],
        minLength: [4, 'Username must be between 4 and 22 characters'],
        maxLength: [22, 'Username must be between 4 and 22 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be between 6 and 60 characters'],
        maxLength: [60, 'Password must be between 6 and 60 characters']
    },
    avatar: String,
    gender: { type: String, enum: ['M', 'F'], required: [true, 'Gender is required'] },
    roles: [String],
    wardrobe: [{ type: 'ObjectId', ref: 'Piece' }],
    favorites: [{ type: 'ObjectId', ref: 'Look' }],
    hiddenLooks: [{ type: 'ObjectId', ref: 'Look' }],
    __v: { type: Number, select: false }
});

userSchema.plugin(uniqueValidator, { message: 'The user with name "{VALUE}" already exists' });

//Hash user password
userSchema.pre('save', async function (next) {
    const user = this as Document & IUser;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    return next();
});

userSchema.methods.comparePassword = function (candidatePassword: string) {
    const user = this as IUser;
    return bcrypt.compare(candidatePassword, user.password);
};

userSchema.methods.isAdmin = function () {
    const user = this as IUser;
    return user.roles?.includes('admin');
};

userSchema.methods.addToWardrobe = function (piece: string | Types.ObjectId) {
    const user = this as IUser;
    const pieceId = (typeof piece === 'string') ? Types.ObjectId(piece) : piece;
    if (!user.wardrobe.includes(pieceId)) {
        user.wardrobe.push(pieceId);
    }
};

userSchema.methods.removeFromWardrobe = function (piece: string | Types.ObjectId) {
    const user = this as IUser;
    const pieceId = (typeof piece === 'string') ? Types.ObjectId(piece) : piece;
    user.wardrobe = user.wardrobe.filter((id) => {
        return pieceId.toString() != id.toString();
    });
};

userSchema.methods.addToFavorites = function (look: string | Types.ObjectId) {
    const user = this as IUser;
    const lookId = (typeof look === 'string') ? Types.ObjectId(look) : look;
    if (!user.favorites.includes(lookId)) {
        user.favorites.push(lookId);
    }
};

userSchema.methods.removeFromFavorites = function (look: string | Types.ObjectId) {
    const user = this as IUser;
    const lookId = (typeof look === 'string') ? Types.ObjectId(look) : look;
    user.favorites = user.favorites.filter((id) => {
        return lookId.toString() != id.toString();
    });
};

userSchema.methods.hideLook = function (look: string | Types.ObjectId) {
    const user = this as IUser;
    const lookId = (typeof look === 'string') ? Types.ObjectId(look) : look;
    if (!user.hiddenLooks.includes(lookId)) {
        user.hiddenLooks.push(lookId);
    }
};

userSchema.methods.unhideLook = function (look: string | Types.ObjectId) {
    const user = this as IUser;
    const lookId = (typeof look === 'string') ? Types.ObjectId(look) : look;
    user.hiddenLooks = user.hiddenLooks.filter((id) => {
        return lookId.toString() != id.toString();
    });
};

export const User = model<IUser>('User', userSchema);
