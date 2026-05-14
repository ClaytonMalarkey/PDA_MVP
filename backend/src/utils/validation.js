const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters with at least one number
  return password.length >= 8 && /\d/.test(password);
};

module.exports = { validateEmail, validatePassword };
