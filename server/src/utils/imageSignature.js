const fs = require('fs/promises');

// The first bytes ("magic numbers") identify a file's real format, whatever
// MIME type or name the client claims.
const matchers = {
  'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': b =>
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': b =>
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP',
  // HEIC/HEIF: an ISO-BMFF "ftyp" box with a HEIF brand.
  'image/heic': b =>
    b.subarray(4, 8).toString('latin1') === 'ftyp' &&
    ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(
      b.subarray(8, 12).toString('latin1'),
    ),
};

const verifyImageFile = async (filePath, mimetype) => {
  const matches = matchers[mimetype];
  if (!matches) {
    return false;
  }
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    const {bytesRead} = await handle.read(buffer, 0, 12, 0);
    return bytesRead === 12 && matches(buffer);
  } finally {
    await handle.close();
  }
};

module.exports = {verifyImageFile};
