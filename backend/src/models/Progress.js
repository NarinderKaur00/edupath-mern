import mongoose from "mongoose";

// Which syllabus-topic indices a student has ticked off for a course.
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true },
    done: { type: [Number], default: [] }, // topic indices completed
  },
  { timestamps: true }
);
progressSchema.index({ user: 1, code: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
