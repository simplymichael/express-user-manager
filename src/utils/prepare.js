const env = require('../dotenv');
const logger = require('morgan');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const sessionOptions = {
  secret: env.SESSION_TOKEN_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {}
};

module.exports = prepare;

function prepare(app) {
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

/*
// Credits: https://stackoverflow.com/a/26305831/1743192
function middlewareExists(app, name) {
    return !!app._router.stack.filter(function (layer) {
        return layer && layer.handle && layer.handle.name === name;
    }).length;
}
*/
