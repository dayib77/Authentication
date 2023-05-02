require('dotenv').config(); // Using Environment Variables to Keep key Secrets

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");

// Level 2 - Database Encryption => for secret key
/* const encrypt = require("mongoose-encryption"); */

// Level 3 - Hashing Passwords => simple hash function
/* const md5 = require("md5"); */

// Level 4 - Salting and Hashing Passwords with bcrypt
/*const bcrypt = require("bcrypt");
const saltRounds = 10;*/

// Using APIs to Add Cookies and Sessions:
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// console.log("API key:",process.env.api_key);
// console.log(md5("e80b5017098950fc58aad83c8c14978e"));

// initialize Session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

const connnectDB = "mongodb://127.0.0.1:27017/userDB";
mongoose.set("strictQuery", false);
mongoose.connect(connnectDB, { useNewUrlParser: true });

const userSchema = new mongoose.Schema(
  {
    email: {type: String/*, required: [true, "This field 'email' is mandatory"]*/},
    password: {type: String/*, required: [true, "This field 'password' is mandatory"]*/}
  },
  {versionKey: false}
);

// userSchema.plugin(encrypt, {secret: process.env.secret, encryptedFields: ["password"]});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home")
});

app.route("/register")
  .get((req, res) => {
    res.render("register")
  })
  .post((req, res) => {

    /*bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    // Store hash in your password DB.
      const newUser = new User({
        email: req.body.username,
        password: hash
      });

      newUser.save().then(() => {
        console.log("Successfully saved a new user to userDB");
        res.redirect("/");
      }).catch((err) => {
        console.log(err);
      })

    }).catch((err) => {console.log(err);})*/

    // Setting up Sessions and Cookies using Passport
    User.register({username: req.body.username}, req.body.password).then((user) => {
      passport.authenticate("local")(req, res, () => {
        console.log("Welcome !");
        res.redirect("/secrets");
      })
    }).catch((err) => {
      console.log("Error",err);
      res.redirect("/register");
    })

  });

app.route("/login")
  .get((req, res) => {
    res.render("login")
  })
  .post((rq, rs) => {
    /*const usr = rq.body.username;
    const pwd = (rq.body.password);

    User.findOne({email: usr}).then((foundedUser) => {
        if (foundedUser) {

          bcrypt.compare(pwd, foundedUser.password).then((result) => {
            if (result) {
              console.log(foundedUser.email + " => " + pwd);
              rs.render("secrets");
            } else {
              rs.redirect("/login");
            }
          }).catch((err) => {console.log(err);})*/

          // Using md5 function
          /*if (foundedUser.password === pwd) {
            console.log(foundedUser.email + " => " + foundedUser.password);
            rs.render("secrets");
          } else {
            rs.redirect("/login");
          }*/

        /*} else {
          rs.render("error");
        }
      }).catch((err) => {
        console.log("My error: ",err);
      })*/

      // Login via passport
      const user = new User({
        username: rq.body.username,
        password: rq.body.password
      });

      rq.login(user, (err) => {
        if (err) {
          console.log("My Error", err);
          rs.redirect("/login");
        } else {
          passport.authenticate("local")(rq, rs, () => {
            console.log("Successfully login :)");
            rs.redirect("secrets");
          })
        }
      })
  });

app.route("/secrets")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      console.log("Session still active");
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  })

app.route("/logout")
  .get((req, res) => {
    req.logout((err) => {
      if (!err) {
        console.log("Logout o|o");
        res.redirect("/")
      } else{
        console.log("My error from logout route", err);
      }
    })
  })


















const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server is running on port",PORT);
})
