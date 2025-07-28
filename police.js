// index.js - Node.js Backend with AI/ML Integration

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { spawn } = require("child_process");

// Load env variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const FIRSchema = new mongoose.Schema({
  user_id: String,
  description: String,
  location: String,
  priority: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FIR = mongoose.model("FIR", FIRSchema);

// ML Priority Prediction Function
function getPriorityFromML(description) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["ml_model/predict.py", description]);

    let result = "";
    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
    });

    python.on("close", () => {
      resolve(parseInt(result.trim()));
    });
  });
}

// POST /register_fir
app.post("/register_fir", async (req, res) => {
  const { user_id, description, location } = req.body;
  try {
    const priority = await getPriorityFromML(description);
    const newFIR = new FIR({ user_id, description, location, priority });
    await newFIR.save();
    res.status(201).json({ message: "FIR Registered", fir: newFIR });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registering FIR" });
  }
});

// GET /user_firs/:user_id
app.get("/user_firs/:user_id", async (req, res) => {
  try {
    const firs = await FIR.find({ user_id: req.params.user_id });
    res.json(firs);
  } catch (err) {
    res.status(500).json({ error: "Error fetching FIRs" });
  }
});

// GET /police/firs
app.get("/police/firs", async (req, res) => {
  try {
    const firs = await FIR.find().sort({ priority: 1 });
    res.json(firs);
  } catch (err) {
    res.status(500).json({ error: "Error fetching police FIRs" });
  }
});

// GET /police/priority_alerts
app.get("/police/priority_alerts", async (req, res) => {
  try {
    const alerts = await FIR.find({ priority: 1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching alerts" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
