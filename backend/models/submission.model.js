import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  marks: { type: Number, required: true },
  category: { type: String, default: "General" },
  predictions: [
    {
      campus: String,
      branchName: String,
      branchCode: String,
      degreeType: String,
      percentage: Number,
      status: String,
      latestCutoff: Number,
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Submission = mongoose.model("Submission", submissionSchema);
