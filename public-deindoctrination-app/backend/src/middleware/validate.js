/**
 * Request Validation Middleware
 * Validates request body/params against rules before hitting the controller
 */

const validators = {
  required: (val, field) => (val != null && val !== '') ? null : field + ' is required',
  string: (val, field) => (typeof val === 'string') ? null : field + ' must be a string',
  number: (val, field) => (typeof val === 'number' && !isNaN(val)) ? null : field + ' must be a number',
  min: (min) => (val, field) => (val >= min) ? null : field + ' must be at least ' + min,
  max: (max) => (val, field) => (val <= max) ? null : field + ' must be at most ' + max,
  minLength: (min) => (val, field) => (typeof val === 'string' && val.length >= min) ? null : field + ' must be at least ' + min + ' characters',
  maxLength: (max) => (val, field) => (typeof val === 'string' && val.length <= max) ? null : field + ' must be at most ' + max + ' characters',
  email: (val, field) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : field + ' must be a valid email',
  enum: (values) => (val, field) => values.includes(val) ? null : field + ' must be one of: ' + values.join(', '),
  pattern: (regex, msg) => (val, field) => regex.test(val) ? null : msg || field + ' has invalid format',
  positive: (val, field) => (typeof val === 'number' && val >= 0) ? null : field + ' must be positive',
};

function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, fieldRules] of Object.entries(rules)) {
      const val = req.body[field];
      for (const rule of fieldRules) {
        let error;
        if (typeof rule === 'string') {
          error = validators[rule] ? validators[rule](val, field) : null;
        } else if (typeof rule === 'function') {
          error = rule(val, field);
        }
        if (error) { errors.push(error); break; } // stop at first error per field
      }
    }
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });
    next();
  };
}

// Pre-built validation middleware for common operations
const validateTask = validate({
  taskId: ['required', 'string', validators.minLength(1), validators.maxLength(50)],
  title: ['required', 'string', validators.minLength(3), validators.maxLength(200)],
  description: ['required', 'string', validators.minLength(5), validators.maxLength(1000)],
  category: ['required', 'string'],
  xpReward: ['required', 'number', validators.min(1), validators.max(100000)],
  currencyReward: ['required', 'number', validators.min(0), validators.max(100000)],
});

const validateShopItem = validate({
  itemId: ['required', 'string', validators.minLength(1), validators.maxLength(50), validators.pattern(/^[a-z0-9-]+$/, 'itemId must be lowercase alphanumeric with dashes')],
  name: ['required', 'string', validators.minLength(2), validators.maxLength(100)],
  description: ['required', 'string', validators.minLength(3), validators.maxLength(500)],
  category: ['required', validators.enum(['currency_pack', 'premium', 'booster', 'cosmetic', 'energy'])],
});

const validateStructure = validate({
  structureId: ['required', 'string', validators.minLength(1)],
  name: ['required', 'string', validators.minLength(2), validators.maxLength(100)],
  description: ['required', 'string', validators.minLength(3)],
  baseCost: ['required', 'number', validators.min(1)],
  baseProduction: ['required', 'number', validators.min(0)],
});

const validateCategory = validate({
  name: ['required', 'string', validators.minLength(2), validators.maxLength(50)],
});

const validateLogin = validate({
  email: ['required', 'string', validators.email],
  password: ['required', 'string', validators.minLength(6)],
});

const validateRegister = validate({
  email: ['required', 'string', validators.email],
  password: ['required', 'string', validators.minLength(6), validators.maxLength(128)],
});

module.exports = {
  validate, validators,
  validateTask, validateShopItem, validateStructure, validateCategory,
  validateLogin, validateRegister
};
