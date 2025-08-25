import mongoose, { Schema, Document, Types} from "mongoose";

export interface IEsop extends Document {
  employeeId: Types.ObjectId;
  tokenAmount: number;
  vestingStart: Date;
  cliffMonths: number;
  vestingMonths: number;
  txHash?: string;
  createdAt: Date;
  claimed: number;
}

const EsopSchema = new Schema<IEsop>({
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  tokenAmount: { type: Number, required: true },
  vestingStart: { type: Date, required: true },
  cliffMonths: { type: Number, required: true },
  vestingMonths: { type: Number, required: true },
  claimed: { type: Number, default: 0 },
  txHash: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Esop || mongoose.model<IEsop>("Esop", EsopSchema);
