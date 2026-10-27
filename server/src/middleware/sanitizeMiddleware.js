// Strips keys starting with '$' or containing '.' from user input so that a
// JSON body like {"email": {"$ne": null}} can never turn into a MongoDB
// operator (NoSQL injection). express-mongo-sanitize is not compatible with
// Express 5 (req.query is read-only), and Express 5's default query parser
// does not build nested objects, so only body and params need cleaning.
const clean = value => {
  if (Array.isArray(value)) {
    return value.map(clean);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        value[key] = clean(value[key]);
      }
    }
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    clean(req.body);
  }
  if (req.params) {
    clean(req.params);
  }
  next();
};

module.exports = {sanitizeInput};
