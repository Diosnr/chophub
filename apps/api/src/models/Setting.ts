import mongoose, { Schema, Document } from 'mongoose';

export interface SettingDocument extends Document {
  key: string;
  value: number;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<SettingDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<SettingDocument>('Setting', settingSchema);
