const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'A tour name must have less or equal than 40 characters',
      ],
      minLength: [
        10,
        'A tour name must have greater or equal than 10 characters',
      ],
      // validator library
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current document on creation
          return val < this.price;
        },
        message:
          'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      { type: mongoose.Schema.ObjectId, ref: 'User' },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexing for prices to achieve efficient querying
// tourSchema.index({ price: 1 });

// Create compound index for faster querying
tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate. It is a very handy middleware because it eliminates
// the extra space usage of child referencing. In this program, keeping a
// reference to a review in tour model would end up with thousands of ids.
// Therefore, virtual populate finds all the children of the tour model.
// In this case, children are reviews and we will retrieve them by virtually popoulating.
tourSchema.virtual('reviews', {
  // Model to query into"(Model that we want to populate)
  ref: 'Review',
  // value that we are using to query(A field in the current model)
  localField: '_id',
  // the field that we are referring to(field in the target model)
  foreignField: 'tour',
});

tourSchema.virtual('totalReviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
  count: true,
});

// Document Middleware:
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Embedding the tour guides to the tours data
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (id) => await user.findById(id)
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Query Middleware:
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Use populate to get the actual data from their reference
// Exclude the specified fields from the path document
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// Aggregation Middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(
//     `Query took ${Date.now() - this.start} milliseconds`
//   );
//   // console.log(docs);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
