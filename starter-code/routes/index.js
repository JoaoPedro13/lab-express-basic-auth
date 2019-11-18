"use strict";

const { Router } = require("express");
const router = Router();

const User = require("./../models/user");
const bcryptjs = require("bcryptjs");
const routeGuard = require("../middleware/route-guard");
const mongoose = require("mongoose");


router.get("/", (req, res, next) => {
  res.render("index", { title: "Hello World!" });
});

// Sign Up
router.get("/sign-up", (req, res, next) => {
  res.render("sign-up");
});

router.post("/sign-up", (req, res, next) => {
  const { username, password } = req.body;
  bcryptjs
    .hash(password, 10)
    .then(hash => {
      return User.create({
        username,
        passwordHash: hash
      });
    })
    .then(user => {
      console.log("Created user", user);
      req.session.user = user._id;
      res.redirect("/");
    })
    .catch(error => {
      next(error);
    });
});

// Sign In
router.get("/sign-in", (req, res, next) => {
  res.render("sign-in");
});

router.post("/sign-in", (req, res, next) => {
  let userId;
  const { username, password } = req.body;
  User.findOne({ username })
    .then(user => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that name"));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then(result => {
      if (result) {
        console.log("You've logged in.");
        req.session.user = userId;
        console.log(userId);
        res.redirect("/main");
      } else {
        return Promise.reject(new Error("Wrong password."));
      }
    })
    .catch(error => {
      next(error);
    });
});

// Sign Out
router.post("/sign-out", (req, res, next) => {
  req.session.destroy();
  res.redirect("/");
});

// Private Page
router.get("/main", routeGuard, (req, res, next) => {
  res.render("private/main");
});
router.get("/private", routeGuard, (req, res, next) => {
  res.render("private/private");
});

// Profile Page

router.get("/:id/profile", routeGuard, (req, res, next) => {
  User.findById(req.params.id).then(user => {
    res.render("private/profile", user);
  });
});

//Profile edit

router.get("/profile/edit", routeGuard, (req, res, next) => {

  User.findById(req.session.user)
    .then(profile => {
        res.render("private/edit", { profile });
      
      
    })
    .catch(error => {
      next(error);
    });
});

/* router.post("/profile/edit", routeGuard, (req, res, next) => {
  mongoose.set('useFindAndModify', true);
  User.findByIdAndUpdate(req.params.id, {
  
        username: req.body.username,
        name: req.body.name
      }
    )
      .then(() => {
        res.redirect(`/profile`);
      })
      .catch(error => {
        next(error);
      });
  }); */

  router.post('/edit', routeGuard, (req, res, next) => {
    //  mongoose.set('useFindAndModify', false);
    User.findByIdAndUpdate(req.session.user, {
        username: req.body.username,
        name: req.body.name
      })
      .then((data) => {
        res.redirect(`/${data._id}/profile`);
      })
      .catch(error => {
        next(error);
      });
   });


module.exports = router;
