import mongoose from "mongoose";

// The marks a student entered (one document per student, overwritten on save).
const resultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    marks: { type: Object, default: {} }, // { "UML501": 95, "UCS310": 88, ... }
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
