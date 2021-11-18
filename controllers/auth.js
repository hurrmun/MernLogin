const crypto = require("crypto");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");

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
    // console.log("user", user);
    if (!user) {
      // res.status(404).json({ success: false, error: "Invalid Credentials" });
      return next(new ErrorResponse("Invalid Credentials", 401));
    }

    const isMatch = await user.matchPasswords(password);
    // console.log("isMatch", isMatch);

    if (!isMatch) {
      // res.status(404).json({ success: false, error: "Invalid Credentials" });
      return next(new ErrorResponse("Invalid Credentials (password)", 401));
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

exports.forgotpassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      //? you dont want to send "email does not exist as it comprimises security"
      return next(new ErrorResponse("Email could not be sent", 404));
    }
    const resetToken = user.getResetPasswordToken();

    await user.save();
    //? resetUrl will lead to front end
    const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

    //? clicktracking=off prevents sendgrid api from re-routing to a weird link
    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please go to this link to reset your password</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a> 
    `;

    //* Send email using sendgrid api and nodemailer
    try {
      await sendEmail({
        to: user.email,
        subject: "Password reset request",
        text: message,
      });

      res.status(200).json({
        success: true,
        data: "Email Sent",
      });
    } catch (error) {
      //? important as we dont want the tokens to stay if there is an error
      user.getResetPasswordToken = undefined;
      user.getResetPasswordExpire = undefined;

      await user.save();

      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (error) {
    next(error);
  }
};

exports.resetpassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid Reset Token", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password reset success",
    });
  } catch (error) {
    next(error);
  }
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ success: true, token });
};
