"use strict";

const { join } = require("path");
const express = require("express");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const sassMiddleware = require("node-sass-middleware");
const serveFavicon = require("serve-favicon");

const expressSession = require("express-session");
const connectMongo = require("connect-mongo");
const mongoose = require("mongoose");
const MongoStore = connectMongo(expressSession);


const User = require("./models/user");
const app = express();
// Setup view engine
app.set("views", join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(serveFavicon(join(__dirname, "public/images", "favicon.ico")));
app.use(express.static(join(__dirname, "public")));
app.use(
  sassMiddleware({
    src: join(__dirname, "public"),
    dest: join(__dirname, "public"),
    outputStyle:
      process.env.NODE_ENV === "development" ? "nested" : "compressed",
    sourceMap: true
  })
);

const indexRouter = require("./routes/index");

// Cookie

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 24 * 15,
      sameSite: true,
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development"
    },
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24
    })
  })
);

// Deserializing user
app.use((req, res, next) => {
  const userId = req.session.user;
  if (userId) {
    User.findById(userId)
      .then(user => {
        req.user = user;
        res.locals.user = req.user;
        next();
      })
      .catch(error => {
        next(error);
      });
  } else {
    next();
  }
});
app.use("/", indexRouter);
// Catch all error handler
// Catch missing routes and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((error, req, res, next) => {
  // Set error information, with stack only available in development
  res.locals.message = error.message;
  res.locals.error = req.app.get("env") === "development" ? error : {};

  res.status(error.status || 500);
  res.render("error");
});
module.exports = app;
