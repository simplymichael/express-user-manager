const logger = require('morgan');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const debug = require('./debug');
const env = require('../dotenv');
const sessionOptions = {
  resave: false,
  saveUninitialized: false,
  cookie: {}
};

module.exports = prepare;

function prepare(app, sessionSecret) {
  sessionSecret = sessionSecret || env.SESSION_TOKEN_KEY;

  if(typeof sessionSecret !== 'string' || sessionSecret.length < 10) {
    debug(
      `express-user-manager: session secret "${sessionSecret}" does not appear to be secure`);
  }

  sessionOptions.secret = sessionSecret;

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionOptions.cookie.secure = true; // serve secure cookies
  }

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(session(sessionOptions));

  return app;
}
