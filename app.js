var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload=require('express-fileupload')
require('dotenv').config(); // Load environment variables
var db = require('./config/connection')
var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');
var hbs= require('express-handlebars');
var session=require('express-session')
var app = express();
require('dotenv').config(); // Load environment variables


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(session({secret:"Key",
  resave: false, // Prevents session saving when no changes are made
    saveUninitialized: true, // Creates a session even if it is not modified
  cookie:{maxAge:3600000}}))

db.connect((err)=>{
if(err) console.log("Connection error")
else console.log("Database")
})
app.use('/', userRouter);
app.use('/admin', adminRouter);

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
