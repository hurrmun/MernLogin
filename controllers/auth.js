const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.create({
      username,
      email,
      password,
    });
    //? replace your success info to send real token
    // res.status(201).json({
    //   success: true,
    //   token: "3sdf3dsrandom",
    // });
    sendToken(user, 201, res);
  } catch (error) {
    //? since error handler is a middleware, we can just call next()
    // res.status(500).json({
    //   success: false,
    //   error: error.message,
    // });
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    //? Custom Error Handle
    // res
    //   .status(400)
    //   .json({ successs: false, error: "Please provide email and password" });
    return next(new ErrorResponse("Please provide an email and password", 400));
  }
  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      // res.status(404).json({ success: false, error: "Invalid Credentials" });
      return next(new ErrorResponse("Invalid Credentials", 401));
    }

    const isMatch = user.matchPasswords(password);

    if (!isMatch) {
      // res.status(404).json({ success: false, error: "Invalid Credentials" });
      return next(new ErrorResponse("Invalid Credentials", 401));
    }

    // res.status(200).json({
    //   success: true,
    //   token: "234arandoms3rstring",
    // });
    sendToken(user, 200, res);
  } catch (error) {
    next();
  }
};

exports.forgotpassword = (req, res, next) => {
  res.send("Forgot Password Route");
};

exports.resetpassword = (req, res, next) => {
  res.send("Reset Password Route");
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ success: true, token });
};
