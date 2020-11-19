const express = require('express');
const app = express();
const env = require('./dotenv');
const logger = require('morgan');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const { initApiRoutes, normalizePort } = require('./utils/server');

const indexRouter = require('./routes/index');
const sessionOptions = {
  secret: env.SESSION_TOKEN_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {}
};

module.exports = {
  getDefaultApp
};

function getDefaultApp(port) {
  if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionOptions.cookie.secure = true; // serve secure cookies
  }

  port = normalizePort(port);
  app.set('port', port);
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(session(sessionOptions));
  app.use('/', indexRouter);

  initApiRoutes(app);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res) {
    res.status(err.status || 500).json({error: err.message});
  });

  return app;
}
