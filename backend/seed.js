import mongoose from "mongoose";
import dotenv from "dotenv";
import { Cutoff } from "./models/cutoff.model.js";
import { cutoffsData } from "./data/cutoffsData.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bitsat_predictor";
    console.log(`Connecting to database to seed: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    await Cutoff.deleteMany({});
    console.log("Existing cutoffs cleared.");

    await Cutoff.insertMany(cutoffsData);
    console.log(`Successfully seeded ${cutoffsData.length} records!`);

    await mongoose.disconnect();
    console.log("Disconnected from database.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
