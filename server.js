// server.js
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// CLOUDINARY SETUP
// ─────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────
// VIEW ENGINE
// ─────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ─────────────────────────────────────────
// TEMP UPLOADS FOLDER
// ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─────────────────────────────────────────
// MULTER CONFIG
// ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
}).single("file");

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// HOME PAGE
app.get("/", (req, res) => {
  res.render("index");
});

// UPLOAD → CLOUDINARY
app.post("/uploadfile", (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err || !req.file) {
        return res.status(400).json({ error: "Upload failed" });
      }

      const localPath = req.file.path;

      // Upload any file type
      const result = await cloudinary.uploader.upload(localPath, {
        resource_type: "auto",
      });

      // DEBUG
      console.log("▶ CLOUDINARY UPLOAD RESULT:");
      console.log(JSON.stringify(result, null, 2));

      fs.unlink(localPath, () => {});

      // SEND BOTH fileId + secure_url
      return res.json({
        fileId: result.public_id,
        fileUrl: result.secure_url, // <–– THE WORKING URL
      });

    } catch (cloudErr) {
      console.error("Cloudinary Upload Error:", cloudErr);
      return res.status(500).json({ error: "Cloud upload failed" });
    }
  });
});

// FILE DETAILS PAGE (uses secure_url from query string)
app.get("/files/:id", (req, res) => {
  const fileId = req.params.id;
  const fileUrl = req.query.url; // <–– THE ONLY CORRECT SOURCE

  console.log("▶ FILE PAGE OPENED");
  console.log("▶ FILE ID:", fileId);
  console.log("▶ FILE URL:", fileUrl);
  console.log("FINAL FILE URL SENT TO FRONTEND =", fileUrl);
  res.render("displayfile", { fileId, fileUrl });
});

// HEALTHCHECK
app.get("/health", (req, res) => res.send("OK"));

// START SERVER
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
