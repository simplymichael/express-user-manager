const express = require('express');
const app = express();
const env = require('./dotenv');
const logger = require('morgan');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');

const apiVersion = env.API_VERSION;
const indexRouter = require('./routes/index');
const apiRoutes = require(`./routes/api-v${apiVersion}`);
const sessionOptions = {
  secret: env.SESSION_TOKEN_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {}
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(sessionOptions));

app.use('/', indexRouter);

// Setup API routing table
for(const route in apiRoutes) {
  const regexp = route === 'index'
    ? `/api/v${apiVersion}/?`
    : `/api/v${apiVersion}/${route}`;

  app.use(new RegExp(regexp, 'i'), apiRoutes[route]);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  res.status(err.status || 500).json({error: err.message});
});

module.exports = app;
