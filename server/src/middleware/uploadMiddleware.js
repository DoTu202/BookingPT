const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const PROFILE_DIR = path.join(UPLOADS_ROOT, 'profiles');
fs.mkdirSync(PROFILE_DIR, {recursive: true});

// The extension is derived from an allow-list of MIME types and never from the
// client-supplied filename, so a file such as "x.html" sent as "image/png"
// cannot be served back as HTML (stored XSS).
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
};

const storage = multer.diskStorage({
  destination: PROFILE_DIR,
  filename: (req, file, cb) => {
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, `profile-${req.user._id}-${Date.now()}-${random}${ALLOWED_TYPES[file.mimetype]}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    error.message = 'Only JPEG, PNG, WEBP or HEIC images are allowed';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

module.exports = upload;
module.exports.UPLOADS_ROOT = UPLOADS_ROOT;
module.exports.PROFILE_DIR = PROFILE_DIR;
