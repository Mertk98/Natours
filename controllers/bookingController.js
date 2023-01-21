const Tour = require('../models/tourModel.js');
const catchAsync = require('../utils/catchAsync.js');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Create checkout session

  // 3) Create session as response
});
