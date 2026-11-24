// MongoDB connection (Mongoose).
//  - If MONGODB_URI is set  -> connect to that (your MongoDB Atlas cluster).
//  - If it is blank         -> spin up a zero-setup in-memory MongoDB so the
//                              app runs instantly for local testing.
// This mirrors the Flask app's "real Atlas, else mongomock" behaviour.
import mongoose from "mongoose";

export async function connectDB() {
  let uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB?.trim() || "edupath_mern";

  if (!uri) {
    // No URI -> try the optional in-memory server.
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mem = await MongoMemoryServer.create();
      uri = mem.getUri();
      console.log("⚠  No MONGODB_URI set — using a temporary IN-MEMORY database.");
      console.log("   (data is wiped on restart; set MONGODB_URI in .env for a real DB)");
    } catch (e) {
      console.error("No MONGODB_URI set and in-memory DB is unavailable.");
      console.error("Add MONGODB_URI to backend/.env (your Atlas string).");
      throw e;
    }
  }

  await mongoose.connect(uri, { dbName });
  console.log(`✔  MongoDB connected (db: ${dbName})`);
}
