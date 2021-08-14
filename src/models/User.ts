import { Document, model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
    name: string,
    password: string
    avatar?: string
    comparePassword: (candidatePassword: string) => Promise<boolean>
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Username is required'],
        unique: [true, 'User with this name already exists'],
        minLength: [4, 'Username must be between 4 and 22 characters'],
        maxLength: [22, 'Username must be between 4 and 22 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be between 6 and 60 characters'],
        maxLength: [60, 'Password must be between 6 and 60 characters']
    },
    avatar: String
});

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

export const User = model<IUser>('User', userSchema);