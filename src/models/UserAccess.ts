import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserAccess extends Document {
    userId: string;
    keyUsed?: string;
    keyName?: string;
    startAt: Date;
    expireAt: Date;
    webhook?: string;
    build: {
        name: string,
        version: string,
        productName: string,
        fileDescription: string,
        company: string,
        legalCopyright: string,
        icon: string,
        theme: string,
        key: string[]
    }
}

const UserAccessSchema: Schema = new Schema({
    userId: { type: String, unique: true },
    keyUsed: { type: String },
    keyName: { type: String },
    startAt: { type: Date },
    expireAt: { type: Date },
    webhook: { type: String },
    build: {
        name: { type: String },
        version: { type: String },
        productName: { type: String },
        fileDescription: { type: String },
        company: { type: String },
        legalCopyright: { type: String },
        icon: { type: String },
        theme: { type: String },
        key: { type: Array }
    }
});

const UserAccess: Model<IUserAccess> = mongoose.models.UserAccess || mongoose.model<IUserAccess>('UserAccess', UserAccessSchema);

export default UserAccess;
