const multer = require("multer");
const path = require("path");

const storge = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
  const allowedFileTypes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/octet-stream",
  ];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedFileTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Chỉ chấp nhận file ảnh (JPG, PNG, JPEG) hoặc file nén (ZIP, RAR)!"
      )
    );
  }
};

const upload = multer({
  storage: storge,
  fileFilter: fileFilter,
});

module.exports = upload;
