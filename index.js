const path = require("path");
const express = require("express");
const bodyparser = require("body-parser");
var rimraf = require("rimraf");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.set("view engine", "ejs");

var uploadsDir = __dirname + "/public/uploads";

// setInterval(() => {
//   fs.readdir(uploadsDir, function (err, files) {
//     files.forEach(function (file, index) {
//       fs.stat(path.join(uploadsDir, file), function (err, stat) {
//         var endTime, now;
//         if (err) {
//           return console.error(err);
//         }
//         now = new Date().getTime();
//         endTime = new Date(stat.ctime).getTime() + 60000;
//         if (now > endTime) {
//           return rimraf(path.join(uploadsDir, file), function (err) {
//             if (err) {
//               return console.error(err);
//             }
//             console.log("successfully deleted");
//           });
//         }
//       });
//     });
//   });
// }, 2000);
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var maxSize = 10000 * 1024 * 1024;

var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

app.use(express.static(path.resolve(__dirname + "/public/uploads")));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/uploadfile", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file." + err);
    }
    res.json({
      path: req.file.filename,
    });
  });
});

app.get("/files/:id", (req, res) => {
  console.log(req.params.id);
  res.render("displayfile", { path: req.params.id });
});

app.get("/download", (req, res) => {
  var pathoutput = req.query.path;
  console.log(pathoutput);
  var fullpath = path.join(__dirname, pathoutput);
  res.download(fullpath, (err) => {
    if (err) {
      res.send(err);
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("App is listening on port 3000");
});
