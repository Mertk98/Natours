const mongoose = require('mongoose');
const Tour = require('./tourModel');
const AppError = require('../utils/appError');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review can't be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must have a rating'],
    },
    cratedAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must be belong to a user'],
    },
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Creating a compound index for efficient querying.
// As well as querying, limit users setting the unique option to true.
// That way, every user will be able to create at most 1 review for each tour.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: '-guides name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (
  tourId
) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

//check if the tour exists before adding the review
reviewSchema.pre('save', async function (next) {
  const doc = await Tour.findById(this.tour);

  if (!doc) {
    next(new AppError('No tours found!!!', 404));
  }
});

// Before I combined both findOneAnd and save
// reviewSchema.post('save', function () {
//   // this points to current review
//   // constructor is the model that created the docuement(this)
//   this.constructor.calcAverageRatings(this.tour);
// });

// Alternative way to get the current document
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.clone().findOne();
//   next();
// });

// We use this because findOne query is already executed
// Also combine it with save. That way, we make changes on save(creation)
reviewSchema.post(/save|^findOneAnd/, async (doc) => {
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
