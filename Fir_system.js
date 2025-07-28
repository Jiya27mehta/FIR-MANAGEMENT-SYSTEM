// FIR Auto-Registration System

// ✅ Dependencies:
// npm install express mongoose dotenv cors

// 📁 Single-File Version: index.js

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Setup
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/fir_db";
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Mongoose Schema
const firSchema = new mongoose.Schema({
  user_id: String,
  fir_type: String,
  description: String,
  location: String,
  date_filed: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" },
  priority: { type: Number, default: 3 } // 1 = High, 2 = Medium, 3 = Low
});

const FIR = mongoose.model("FIR", firSchema);

// Utility Function: Auto Priority Assignment
function assignPriority(fir_type, description) {
  const critical_keywords = ["fraud", "cybercrime", "financial scam", "hacking", "extortion", "terror"];
  fir_type = fir_type.toLowerCase();
  description = description.toLowerCase();

  if (["cybercrime", "terrorism", "murder"].includes(fir_type)) return 1;
  if (critical_keywords.some(word => description.includes(word))) return 1;
  if (["theft", "harassment", "missing"].includes(fir_type)) return 2;
  return 3;
}

// Routes

// Register FIR
app.post("/register_fir", async (req, res) => {
  try {
    const { user_id, fir_type, description, location } = req.body;
    const priority = assignPriority(fir_type, description);
    const fir = new FIR({ user_id, fir_type, description, location, priority });
    await fir.save();
    res.json({ message: "FIR registered", priority, id: fir._id });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get User FIRs
app.get("/user_firs/:user_id", async (req, res) => {
  try {
    const firs = await FIR.find({ user_id: req.params.user_id });
    res.json(firs);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All FIRs (Police View)
app.get("/police/firs", async (req, res) => {
  try {
    const firs = await FIR.find().sort({ priority: 1 });
    res.json(firs);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get High Priority FIRs (Police Alerts)
app.get("/police/priority_alerts", async (req, res) => {
  try {
    const firs = await FIR.find({ priority: 1 }).sort({ date_filed: -1 });
    res.json(firs);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
