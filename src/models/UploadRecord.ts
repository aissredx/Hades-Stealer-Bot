import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUploadRecord extends Document {
    route: string;
    uploader?: string;
    originalName?: string;
    filePath?: string;
    meta?: any;
    createdAt: Date;
}

const UploadRecordSchema: Schema = new Schema({
    route: { type: String, required: true },
    uploader: { type: String },
    originalName: { type: String },
    filePath: { type: String },
    meta: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

const UploadRecord: Model<IUploadRecord> = mongoose.models.UploadRecord || mongoose.model<IUploadRecord>('UploadRecord', UploadRecordSchema);

export default UploadRecord;
