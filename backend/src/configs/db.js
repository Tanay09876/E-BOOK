const ENV = require("./env");
const mongoose = require("mongoose");

// Maintain cached connection across hot-reloads or repeated calls
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  if (!ENV.DB_URI) {
    throw new Error("'DB_URI' is not defined in environment variables!");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(ENV.DB_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB:", mongooseInstance.connection.host);

      mongooseInstance.connection.on("disconnected", () => {
        console.warn("Mongoose disconnected!");
        cached.conn = null;
        cached.promise = null;
      });

      mongooseInstance.connection.on("error", (err) => {
        console.error("Mongoose connection error:", err);
      });

      return mongooseInstance;
    }).catch((error) => {
      console.error("Error connecting to MongoDB", error);
      cached.promise = null; // reset promise so that subsequent attempts can retry
      process.exit(1);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

module.exports = { connectToDB };
