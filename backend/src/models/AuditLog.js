import mongoose from "mongoose";

// A record of admin actions (login, retrain, reset/delete student, export).
const auditSchema = new mongoose.Schema(
  {
    actor: String,
    action: String,
    detail: String,
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditSchema);
