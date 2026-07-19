import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Cutoff } from "./models/cutoff.model.js";
import { cutoffsData } from "./data/cutoffsData.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bitsat_predictor";
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    isMongoConnected = true;
  })
  .catch((err) => {
    console.warn("MongoDB connection failed. Backend will automatically fall back to local in-memory dataset.");
    isMongoConnected = false;
  });

// Predict API Endpoint
app.post("/api/predict", async (req, res) => {
  try {
    const { marks } = req.body;
    
    if (marks === undefined || marks === null || isNaN(marks)) {
      return res.status(400).json({ message: "Valid marks are required." });
    }

    const score = Number(marks);

    // Fetch cutoffs from DB if connected, otherwise use local fallback
    let cutoffsList = [];
    if (isMongoConnected) {
      cutoffsList = await Cutoff.find({});
    }
    
    if (!cutoffsList || cutoffsList.length === 0) {
      console.log("Using in-memory cutoff data.");
      cutoffsList = cutoffsData;
    }

    // Process predictions
    const predictions = cutoffsList.map((item) => {
      // Convert document to plain object if it came from Mongoose
      const data = item.toObject ? item.toObject() : item;
      
      // BITSAT marks fluctuate, we calculate probability based on 2024 (latest) and historical averages
      const cutoff2024 = data.cutoffs[2024];
      const cutoff2023 = data.cutoffs[2023];
      const cutoff2022 = data.cutoffs[2022];
      
      const maxCutoff = Math.max(cutoff2024 || 0, cutoff2023 || 0, cutoff2022 || 0);
      const minCutoff = Math.min(cutoff2024 || 390, cutoff2023 || 390, cutoff2022 || 390);
      const avgCutoff = Math.round(((cutoff2024 || 0) + (cutoff2023 || 0) + (cutoff2022 || 0)) / 3);

      let status = "Unavailable";
      let percentage = 0;

      if (score >= cutoff2024 + 15) {
        status = "Very High";
        percentage = 95 + Math.min(5, Math.max(0, (score - cutoff2024 - 15) * 0.3));
      } else if (score >= cutoff2024) {
        status = "High";
        // Map score between cutoff and cutoff+15 to 75% - 95%
        percentage = 75 + ((score - cutoff2024) / 15) * 20;
      } else if (score >= cutoff2024 - 10) {
        status = "Medium";
        // Map score between cutoff-10 and cutoff to 40% - 75%
        percentage = 40 + ((score - (cutoff2024 - 10)) / 10) * 35;
      } else if (score >= cutoff2024 - 25) {
        status = "Low";
        // Map score between cutoff-25 and cutoff-10 to 10% - 40%
        percentage = 10 + ((score - (cutoff2024 - 25)) / 15) * 30;
      } else {
        status = "Unavailable";
        percentage = Math.max(0, (score / cutoff2024) * 8);
      }

      // Safeguard percentage bounds
      percentage = Math.round(Math.min(100, Math.max(0, percentage)));

      return {
        ...data,
        prediction: {
          status,
          percentage,
          avgCutoff,
          minCutoff,
          maxCutoff
        }
      };
    });

    res.json({
      userInput: { marks: score },
      dataSource: isMongoConnected ? "database" : "local_memory",
      predictions
    });
  } catch (error) {
    console.error("Error in prediction server route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Health check and data list
app.get("/api/cutoffs", async (req, res) => {
  try {
    let data = [];
    if (isMongoConnected) {
      data = await Cutoff.find({});
    }
    if (!data || data.length === 0) {
      data = cutoffsData;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

app.listen(PORT, () => {
  console.log(`BITSAT Predictor server running on http://localhost:${PORT}`);
});
