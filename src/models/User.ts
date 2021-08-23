import { Document, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';

export interface IUser {
    name: string,
    password: string
    avatar?: string
    roles: string[]
    comparePassword: (candidatePassword: string) => Promise<boolean>
    isAdmin: () => boolean
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
    roles: [String],
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

export const User = model<IUser>('User', userSchema);