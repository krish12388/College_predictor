import mongoose from "mongoose";

const cutoffSchema = new mongoose.Schema({
  branchCode: { type: String, required: true },
  branchName: { type: String, required: true },
  campus: { type: String, required: true },
  degreeType: { type: String, required: true }, // "B.E." or "M.Sc."
  cutoffs: {
    2024: { type: Number },
    2023: { type: Number },
    2022: { type: Number }
  }
});

export const Cutoff = mongoose.model("Cutoff", cutoffSchema);
