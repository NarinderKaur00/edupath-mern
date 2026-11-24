import mongoose from "mongoose";

// A registered student.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    consent: { type: Boolean, default: false },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

export default mongoose.model("User", userSchema);
