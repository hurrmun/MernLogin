const ErrorResponse = require("../utils/errorResponse");

//* error arguement goes first
const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  //   console.log("error message in error.js middleware", err);

  if (err.code === 11000) {
    const message = "Duplicatre Field Value Enter";
    error = new ErrorResponse(message, 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.messsage);
    error = new ErrorResponse(message(400));
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
