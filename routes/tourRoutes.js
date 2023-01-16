const express = require('express');
const {
  uploadTourImages,
  resizeTourImages,
  aliasTopTours,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictedTo('user'),
//     reviewController.createReview
//   );

// better way of the implementation above
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

// define own parameter middleware
//router.param('id', checkID);

// Protect the tour routes by adding middleware functions before them
router
  .route('/')
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    createTour
  );

router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(
    authController.protect,
    authController.restrictedTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;
