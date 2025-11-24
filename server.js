// server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Serve static files and JSON
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

// 2) Ensure folders exist
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// 3) Simple JSON "database"
const DB_FILE = "./data/pastes.json";
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({}));

const loadDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const saveDB = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// 4) Multer storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 5) API: create a new paste (text and/or file)
app.post("/api/paste", upload.single("file"), (req, res) => {
  const { text } = req.body;
  const file = req.file || null;

  if (!text && !file) {
    return res.status(400).json({ error: "No content provided" });
  }

  const id = crypto.randomBytes(5).toString("hex");
  const db = loadDB();

  db[id] = {
    id,
    text: text || null,
    file: file
      ? {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: "/uploads/" + file.filename,
        }
      : null,
    createdAt: new Date().toISOString(),
  };

  saveDB(db);

  // use /view here
  res.json({
    id,
    url: `/view/${id}`,
  });
});

// 6) API: get paste data for viewer
app.get("/api/paste/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const paste = db[id];

  if (!paste) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(paste);
});

// 7) Viewer HTML route at /view/:id
app.get("/view/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "viewer.html"));
});

// 8) Start server
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
