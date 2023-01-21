const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Defining the view engine (pug)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
// order matters bacause of the middleware stack

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// 1) Global Middlewares

// A middleware to secure http headers
// Further HELMET configuration for Security Policy (CSP)
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.2/axios.min.js',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: [
        "'self'",
        'https:',
        'http:',
        'blob:',
        'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.2/axios.min.js',
        'unsafe-eval',
      ],
      scriptSrcElem: [
        "'self'",
        'https:',
        'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.2/axios.min.js',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
    },
  })
);

app.use(cors({ origin: 'http://127.0.0.1:8080', credentials: 'true' }));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Only allow certain amount of requests from the same IP
// in a certain time to prevent DDOS attack
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against noSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
// Can whitelist some fields for advance filtering
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// User defined middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware :)');
//   next();
// });

// Test middleware to see the headers
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  //console.log(req.cookies)
  next();
});

// Routers

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookins', bookingRouter);

// If the program is able to reach here, it means that the
// above router haven't worked. Therefore, program will use this middleware
// function to send a response.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  // Alternative way: Create a new error object
  // const err = new Error(
  //   `Can't find ${req.originalUrl} on this server!`
  // );
  // err.statusCode = 404;
  // err.status = 'failed';

  // Whatever is passed in to the next function is recognized as an error.
  // And express automatically passes that to the next middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
