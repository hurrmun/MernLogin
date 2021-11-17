const express = require("express");
const router = express();

const {
  register,
  login,
  forgotpassword,
  resetpassword,
} = require("../controllers/auth");

router.route("/register").post(register);
//? router.post("/register", register)

router.route("/login").post(login);

router.route("/forgotpassword").post(forgotpassword);

router.route("/resetpassword/:resetToken").put(resetpassword);

module.exports = router;
