const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
app.use("/api", require("./routes/firRoutes"));
app.use("/api/police", require("./routes/police"));
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/user", require("./routes/user"));
app.use("/api/docs", require("./routes/swagger"));
module.exports = app;
