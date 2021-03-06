var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require("express-session");
var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;

const dashboardRouter = require('./routes/dashboard');
const publicRouter = require('./routes/public');
const usersRouter = require("./routes/users");

var app = express();

//We call Okta to do login using his page
var oktaClient = new okta.Client({
  orgUrl: 'https://dev-416520.okta.com',
  token: '008O7a-XYrq8NQFvMac2Es-Qsk2Wb7_LytuSUKl0do'
});
const oidc = new ExpressOIDC({
  issuer: "https://dev-416520.okta.com/oauth2/default",
  client_id: "0oad7fj7nYS4TBzcX356",
  client_secret: "9FtPbJ7VWAKp5L2S5gQ5oDxbrANK6rZ9P4pS2ysX",
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
//creamos un token en las cookies de login
app.use(session({
  secret: 'vljhbgjgbhjbgjhbgjhbghjgbhjbghjbgjhghj',
  resave: true,
  saveUninitialized: false
}));
//We call oidc sesion
app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }
  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

//indica que requiere login
function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}


app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
