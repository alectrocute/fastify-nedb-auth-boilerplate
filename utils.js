const crypto = require("crypto");

const genRandomString = function (length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex") /** convert to hexadecimal format */
    .slice(0, length); /** return required number of characters */
};

const sha512 = function (password, salt) {
  let hash = crypto.createHmac("sha512", salt); /** Hashing algorithm sha512 */
  hash.update(password);
  let value = hash.digest("hex");
  return {
    salt: salt,
    passwordHash: value,
  };
};

const decrypt = function (passwordToCheck, passwordHash, salt) {
  let hash = crypto.createHmac("sha512", salt); /** Hashing algorithm sha512 */
  hash.update(passwordToCheck);
  let value = hash.digest("hex");
  return value === passwordHash;
};

const saltHashPassword = function (userpassword, salt = genRandomString(16)) {
  let passwordData = sha512(userpassword, salt);
  return passwordData;
};

module.exports = {
  saltHashPassword,
  genRandomString,
  sha512,
  decrypt,
};
