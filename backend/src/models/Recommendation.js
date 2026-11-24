import mongoose from "mongoose";

// A saved recommendation result (history). payload = whatever the ML service returned.
const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    payload: { type: Object, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Recommendation", recommendationSchema);
