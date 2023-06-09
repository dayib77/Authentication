require("dotenv").config(); // Using Environment Variables to Keep key Secrets

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

// Level 6 - Using OAuth 2.0 to sign in with Google API
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

// Level 6 - Using OAuth 2.0 to sign in with Microsoft LinkedIn API
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

// console.log("API key:",process.env.api_key);
// console.log(md5("e80b5017098950fc58aad83c8c14978e"));

// initialize Session - Level 5 - Cookies and Sessions
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const connnectDB = "mongodb://127.0.0.1:27017/userDB";
mongoose.set("strictQuery", false);
mongoose.connect(connnectDB, { useNewUrlParser: true });

// Schema
const userSchema = new mongoose.Schema(
  {
    username: String/*{type: String, required: [true, "This field 'email' is mandatory"]}*/,
    password: String/*{type: String, required: [true, "This field 'password' is mandatory"]}*/,
    appID: String,
    provider: String,
    secret: String
  }/*,
  {versionKey: false}*/
);

// userSchema.plugin(encrypt, {secret: process.env.secret, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); // Made up function aims to find or create a document

const User = mongoose.model("User", userSchema);

// Local Strategy
passport.use(User.createStrategy());

/*passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());*/
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log("My personal Info from google:\n",profile.provider);
    User.findOrCreate({ appID: profile.id, provider: profile.provider }, function (err, user) {
      return cb(err, user);
    });
  }
));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_KEY,
    clientSecret: process.env.LINKEDIN_SECRET,
    callbackURL: "http://localhost:3000/auth/linkedin/secrets",
    scope: ["r_emailaddress", "r_liteprofile"],
    state: true
  },
  function(accessToken, refreshToken, profile, cb) {
  // asynchronous verification, for effect...
  // console.log("My personal Info from LinkedIn:\n",profile);
  User.findOrCreate({ appID: profile.id, provider: profile.provider }, function (err, user) {
    return cb(err, user);
  });

}));



app.get("/", (req, res) => {
    res.render("home")
});

// Google authenticaton
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

// Microsoft LinkedIn authentication
app.get("/auth/linkedin",
  passport.authenticate("linkedin")
);

app.get("/auth/linkedin/secrets",
  passport.authenticate("linkedin", {/* successRedirect: "/secrets",*/failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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
        res.redirect("/login");
      })
    }).catch((err) => {
      console.log("User already exist, try again");
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
          // console.log("My Error", err);
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
      console.log("Result=", req.user.id);
      User.find({ "_id": {$eq: req.user.id}, "secret": {$ne: null} }).then((users) => {
        // console.log("Result=", users);
        res.render("secrets", {Usr: users});
      }).catch((err) => {console.log(err);})
    } else {
      res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (!err) {
        console.log("Logout o|o");
        res.redirect("/")
      } else{
        console.log("My error from logout route", err);
      }
    })
});

app.route("/submit")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  }).post((rq,rs) => {
    const submittedSecret = rq.body.secret;
    // console.log(rq.user);
    const userID = rq.user.id;

    User.findById({_id: userID}).then((foundedUser) => {
      if (foundedUser) {
        foundedUser.secret = submittedSecret;
        foundedUser.save().then(() => {
          console.log("Document updated with secret field");
          rs.redirect("/secrets");
        }).catch((err) => {console.log(err);})
      }
    }).catch((err) => {console.log("Error from post submit secret/n",err);})
  });

















const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server is running on port",PORT);
})
