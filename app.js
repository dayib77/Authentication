require('dotenv').config(); // Using Environment Variables to Keep key Secrets

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");

// const encrypt = require("mongoose-encryption"); // Level 2 - Database Encryption => for secret key

// const md5 = require("md5"); // Level 3 - Hashing Passwords => simple hash function

const bcrypt = require("bcrypt"); // Level 4 - Salting and Hashing Passwords with bcrypt
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// console.log("API key:",process.env.api_key);
// console.log(md5("e80b5017098950fc58aad83c8c14978e"));

const connnectDB = "mongodb://127.0.0.1:27017/userDB";
mongoose.set("strictQuery", false);
mongoose.connect(connnectDB, { useNewUrlParser: true });

const userSchema = new mongoose.Schema(
  {
    email: {type: String, required: [true, "This field 'email' is mandatory"]},
    password: {type: String, required: [true, "This field 'password' is mandatory"]}
  },
  {versionKey: false}
);

// userSchema.plugin(encrypt, {secret: process.env.secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home")
});

app.route("/register")
  .get((req, res) => {
    res.render("register")
  })
  .post((req, res) => {

    bcrypt.hash(req.body.password, saltRounds).then((hash) => {
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

    }).catch((err) => {console.log(err);})
  });

app.route("/login")
  .get((req, res) => {
    res.render("login")
  })
  .post((rq, rs) => {
    const usr = rq.body.username;
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
          }).catch((err) => {console.log(err);})

          /*if (foundedUser.password === pwd) {
            console.log(foundedUser.email + " => " + foundedUser.password);
            rs.render("secrets");
          } else {
            rs.redirect("/login");
          }*/
        } else {
          rs.render("error");
        }
      }).catch((err) => {
        console.log("My error: ",err);
      })
  });



















const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server is running on port",PORT);
})
