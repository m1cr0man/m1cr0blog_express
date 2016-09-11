const path = require('path');
const crypto = require('crypto');
const logger = require('morgan');
const express = require('express');
const favicon = require('serve-favicon');
const busBoy = require('express-busboy');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routing = require('./middleware/routing');
const cookies = require('./middleware/fs-cookie');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(crypto.randomBytes(20).toString('hex')));
app.use(express.static(path.join(__dirname, 'public')));

// BusBoy Body parser
// Supports Multipart/form-data
busBoy.extend(app, {
    upload: true,
    path: 'private/uploads-tmp'
});

app.use(cookies.load);

app.use('/', routing);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
