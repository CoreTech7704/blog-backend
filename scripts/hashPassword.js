const bcrypt = require("bcrypt");

(async () => {
  const password = "Admin@123";
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
})();
