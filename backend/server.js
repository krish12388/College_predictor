import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Cutoff } from "./models/cutoff.model.js";
import { cutoffsData } from "./data/cutoffsData.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isMongoConnected = false;
let cachedCutoffRecords = [];
let cutoffDataSource = "fallback";

const mongoUri = process.env.MONGODB_URI ;

const campusOrder = ["Pilani", "Goa", "Hyderabad"];
const categoryFactors = {
  General: 1,
  OBC: 0.97,
  EWS: 0.98,
  SC: 0.93,
  ST: 0.9,
  PwD: 0.9,
};

function normalizeCollegeName(college) {
  const raw = String(college || "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (lower.includes("pilani")) return "Pilani";
  if (lower.includes("goa")) return "Goa";
  if (lower.includes("hyderabad")) return "Hyderabad";
  return raw;
}

function normalizeProgrammeName(programme) {
  const raw = String(programme || "").trim();
  if (!raw) return "";
  const cleaned = raw
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const aliases = {
    "be computer science": "Computer Science",
    "be electronics and communication": "Electronics & Communication",
    "be electrical and electronics": "Electrical & Electronics",
    "be mechanical": "Mechanical Engineering",
    "be chemical": "Chemical Engineering",
    "be civil": "Civil Engineering",
    "be electronics and instrumentation": "Electronics & Instrumentation",
    "be manufacturing": "Manufacturing Engineering",
    "b pharm": "B.Pharm",
    "msc biological sciences": "M.Sc. Biological Sciences",
    "msc chemistry": "M.Sc. Chemistry",
    "msc economics": "M.Sc. Economics",
    "msc mathematics": "M.Sc. Mathematics",
    "msc physics": "M.Sc. Physics",
    "computer science": "Computer Science",
    "electronics and communication": "Electronics & Communication",
    "electrical and electronics": "Electrical & Electronics",
    "mechanical engineering": "Mechanical Engineering",
    "chemical engineering": "Chemical Engineering",
    "civil engineering": "Civil Engineering",
    "electronics and instrumentation": "Electronics & Instrumentation",
    "manufacturing engineering": "Manufacturing Engineering",
    "mathematics and computing": "Mathematics & Computing",
    "biological sciences": "M.Sc. Biological Sciences",
    "chemistry": "M.Sc. Chemistry",
    "economics": "M.Sc. Economics",
    "mathematics": "M.Sc. Mathematics",
    "physics": "M.Sc. Physics",
    "pharm": "B.Pharm",
  };

  return aliases[cleaned] || raw;
}

const branchCatalog = [
  { branchCode: "CS", branchName: "Computer Science" },
  { branchCode: "MNC", branchName: "Mathematics & Computing" },
  { branchCode: "ECE", branchName: "Electronics & Communication" },
  { branchCode: "EEE", branchName: "Electrical & Electronics" },
  { branchCode: "ENI", branchName: "Electronics & Instrumentation" },
  { branchCode: "ME", branchName: "Mechanical Engineering" },
  { branchCode: "CH", branchName: "Chemical Engineering" },
  { branchCode: "MF", branchName: "Manufacturing Engineering" },
  { branchCode: "CE", branchName: "Civil Engineering" },
  { branchCode: "ECO", branchName: "M.Sc. Economics" },
  { branchCode: "MTH", branchName: "M.Sc. Mathematics" },
  { branchCode: "PHY", branchName: "M.Sc. Physics" },
  { branchCode: "CHM", branchName: "M.Sc. Chemistry" },
  { branchCode: "BIO", branchName: "M.Sc. Biological Sciences" },
  { branchCode: "PHM", branchName: "B.Pharm" },
];

function normalizeCategory(category) {
  const raw = String(category || "General").trim();
  if (!raw) return "General";
  const formatted = raw.toLowerCase();
  if (formatted === "general") return "General";
  if (formatted === "obc") return "OBC";
  if (formatted === "ews") return "EWS";
  if (["sc", "scheduled caste"].includes(formatted)) return "SC";
  if (["st", "scheduled tribe"].includes(formatted)) return "ST";
  if (["pwd", "person with disability"].includes(formatted)) return "PwD";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getLatestCutoff(cutoffs = {}) {
  const years = [2024, 2023, 2022];
  for (const year of years) {
    const value = Number(cutoffs?.[year]);
    if (!Number.isNaN(value) && value > 0) return value;
  }
  return null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCutoffPdfCandidates() {
  const directories = [__dirname, path.join(__dirname, "uploads"), path.join(__dirname, "data")];
  const candidates = [];

  for (const directory of directories) {
    if (!fs.existsSync(directory)) continue;
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        candidates.push(path.join(directory, entry.name));
      }
    }
  }

  return candidates;
}

async function loadCutoffPdfFromBackendFolder() {
  const pdfPaths = getCutoffPdfCandidates();
  if (!pdfPaths.length) {
    cachedCutoffRecords = [];
    cutoffDataSource = "fallback";
    return null;
  }

  const pdfPath = pdfPaths[0];
  try {
    const rawBuffer = fs.readFileSync(pdfPath);
    const parsedPdf = await pdfParse(rawBuffer);
    const parsedRecords = parseCutoffPdfText(parsedPdf.text);

    if (!parsedRecords.length) {
      cachedCutoffRecords = [];
      cutoffDataSource = "fallback";
      return null;
    }

    cachedCutoffRecords = parsedRecords;
    cutoffDataSource = `backend_pdf:${path.basename(pdfPath)}`;

    if (isMongoConnected) {
      await Cutoff.deleteMany({});
      await Cutoff.insertMany(parsedRecords);
    }

    return parsedRecords;
  } catch (error) {
    console.warn("Unable to parse cutoff PDF from backend folder.", error.message);
    cachedCutoffRecords = [];
    cutoffDataSource = "fallback";
    return null;
  }
}

function parseCutoffPdfText(rawText) {
  const lines = rawText
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const parsedRecords = [];
  const seen = new Set();

  const branchSearchList = branchCatalog.map((branch) => ({
    ...branch,
    aliases: [branch.branchCode.toLowerCase(), branch.branchName.toLowerCase(), branch.branchName.toLowerCase().replace(/&/g, "and")],
  }));

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const branchMatch = branchSearchList.find((branch) => branch.aliases.some((alias) => lowerLine.includes(alias)));
    if (!branchMatch) continue;

    const numbers = line.match(/\b\d{2,3}\b/g);
    if (!numbers || numbers.length === 0) continue;

    let campusCutoffs = {};
    const numericValues = numbers.map(Number);

    if (numericValues.length >= 3) {
      campusCutoffs = {
        Pilani: numericValues[0],
        Goa: numericValues[1],
        Hyderabad: numericValues[2],
      };
    } else if (numericValues.length === 2) {
      campusCutoffs = {
        Pilani: numericValues[0],
        Goa: numericValues[1],
      };
    } else if (numericValues.length === 1) {
      const targetCampus = campusOrder.find((campus) => lowerLine.includes(campus.toLowerCase()));
      if (targetCampus) {
        campusCutoffs[targetCampus] = numericValues[0];
      }
    }

    if (Object.keys(campusCutoffs).length === 0) continue;

    for (const campus of campusOrder) {
      if (!campusCutoffs[campus]) continue;
      const recordKey = `${branchMatch.branchCode}-${campus}`;
      if (seen.has(recordKey)) continue;
      seen.add(recordKey);
      parsedRecords.push({
        branchCode: branchMatch.branchCode,
        branchName: branchMatch.branchName,
        campus,
        degreeType: branchMatch.branchName.includes("M.Sc.") || branchMatch.branchName.includes("B.Pharm") ? branchMatch.branchName.includes("B.Pharm") ? "B.Pharm" : "M.Sc." : "B.E.",
        cutoffs: { 2024: campusCutoffs[campus] },
      });
    }
  }

  return parsedRecords;
}

function buildPredictionRecords(cutoffsList, marks, category, targetCollege, targetProgramme) {
  const normalizedCategory = normalizeCategory(category);
  const categoryFactor = categoryFactors[normalizedCategory] || 1;
  const numericMarks = Number(marks);
  const normalizedTargetCollege = normalizeCollegeName(targetCollege).toLowerCase();
  const normalizedTargetProgramme = normalizeProgrammeName(targetProgramme).toLowerCase();

  return cutoffsList
    .map((item) => {
      const data = item.toObject ? item.toObject() : item;
      const latestCutoff = getLatestCutoff(data.cutoffs);
      const adjustedCutoff = latestCutoff ? latestCutoff * categoryFactor : null;

      const collegeMatch = Boolean(normalizedTargetCollege && data.campus?.toLowerCase() === normalizedTargetCollege);
      const branchName = normalizeProgrammeName(data.branchName).toLowerCase();
      const branchCode = String(data.branchCode || "").trim().toLowerCase();
      const programmeMatch = Boolean(normalizedTargetProgramme && (
        branchName.includes(normalizedTargetProgramme) ||
        normalizedTargetProgramme.includes(branchName) ||
        branchCode === normalizedTargetProgramme
      ));

      let status = "Unavailable";
      let percentage = 0;

      if (adjustedCutoff == null) {
        status = "Unavailable";
        percentage = 0;
      } else {
        const gap = numericMarks - adjustedCutoff;
        let score = 0;

        if (gap >= 25) {
          status = "Very High";
          score = 95 + Math.min(4, (gap - 25) * 0.15);
        } else if (gap >= 10) {
          status = "High";
          score = 80 + (gap - 10) * 1.2;
        } else if (gap >= 0) {
          status = "Medium";
          score = 58 + gap * 1.1;
        } else if (gap >= -12) {
          status = "Low";
          score = 30 + (gap + 12) * 1.4;
        } else {
          status = "Unavailable";
          score = Math.max(2, (numericMarks / Math.max(adjustedCutoff, 1)) * 12);
        }

        if (collegeMatch) {
          score += 4;
        }
        if (programmeMatch) {
          score += 3;
        }
        if (normalizedCategory === "General") {
          score -= 0.8;
        }

        percentage = clamp(score, 0, 99);
      }

      const cutoff2024 = Number(data.cutoffs?.[2024]);
      const cutoff2023 = Number(data.cutoffs?.[2023]);
      const cutoff2022 = Number(data.cutoffs?.[2022]);
      const maxCutoff = Math.max(cutoff2024 || 0, cutoff2023 || 0, cutoff2022 || 0);
      const minCutoff = Math.min(cutoff2024 || 390, cutoff2023 || 390, cutoff2022 || 390);
      const avgCutoff = Math.round(((cutoff2024 || 0) + (cutoff2023 || 0) + (cutoff2022 || 0)) / 3);

      return {
        ...data,
        prediction: {
          status,
          percentage: Math.round(percentage),
          adjustedCutoff: adjustedCutoff ? Math.round(adjustedCutoff) : null,
          latestCutoff: latestCutoff ? Math.round(latestCutoff) : null,
          avgCutoff,
          minCutoff,
          maxCutoff,
          category: normalizedCategory,
          targetMatch: {
            college: collegeMatch,
            programme: programmeMatch,
          },
        },
      };
    })
    .sort((a, b) => b.prediction.percentage - a.prediction.percentage);
}

async function getCutoffData() {
  if (cachedCutoffRecords.length > 0) {
    return cachedCutoffRecords;
  }

  if (isMongoConnected) {
    const docs = await Cutoff.find({}).lean();
    if (docs && docs.length > 0) {
      cachedCutoffRecords = docs;
      cutoffDataSource = "database";
      return docs;
    }
  }

  const loadedRecords = await loadCutoffPdfFromBackendFolder();
  if (loadedRecords && loadedRecords.length > 0) {
    return loadedRecords;
  }

  cachedCutoffRecords = cutoffsData;
  cutoffDataSource = "fallback";
  return cutoffsData;
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    isMongoConnected = true;
  })
  .catch((err) => {
    console.warn("MongoDB connection failed. Backend will automatically fall back to local dataset.", err.message);
    isMongoConnected = false;
  });

app.post("/api/predict", async (req, res) => {
  try {
    const { name, marks, category, college, programme } = req.body;

    if (marks === undefined || marks === null || Number.isNaN(Number(marks))) {
      return res.status(400).json({ message: "Valid marks are required." });
    }

    const score = Number(marks);
    const cutoffsList = await getCutoffData();
    const predictions = buildPredictionRecords(cutoffsList, score, category, college, programme);

    res.json({
      userInput: { name: name || "Student", marks: score, category: normalizeCategory(category) },
      dataSource: cutoffDataSource,
      predictions,
    });
  } catch (error) {
    console.error("Error in prediction server route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/cutoffs", async (req, res) => {
  try {
    const data = await getCutoffData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", databaseConnected: isMongoConnected });
});

app.listen(PORT, () => {
  console.log(`BITSAT Predictor server running on http://localhost:${PORT}`);
});
