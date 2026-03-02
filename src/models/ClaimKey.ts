import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClaimKey extends Document {
    key: string;
    keyName?: string;
    createdBy?: string;
    createdAt: Date;
    durationDays: number;
    used: boolean;
    usedBy?: string;
    usedAt?: Date;
}

const ClaimKeySchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    keyName: { type: String },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    durationDays: { type: Number, default: 30 },
    used: { type: Boolean, default: false },
    usedBy: { type: String },
    usedAt: { type: Date }
});

const ClaimKey: Model<IClaimKey> = mongoose.models.ClaimKey || mongoose.model<IClaimKey>('ClaimKey', ClaimKeySchema);

export default ClaimKey;
