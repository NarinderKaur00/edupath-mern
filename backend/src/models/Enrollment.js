import mongoose from "mongoose";

// A course a student added to "My Learning".
const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true },
  },
  { timestamps: true }
);
enrollmentSchema.index({ user: 1, code: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
