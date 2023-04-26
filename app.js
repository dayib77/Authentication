// require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// console.log(process.env.api_key);

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

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home")
});

app.route("/register")
  .get((req, res) => {
    res.render("register")
  })
  .post((req, res) => {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password
    });

    newUser.save().then(() => {
      console.log("Successfully saved a new user to userDB");
      res.redirect("/");
    }).catch((err) => {
      console.log(err);
    })
  });

app.route("/login")
  .get((req, res) => {
    res.render("login")
  })
  .post((rq, rs) => {
    const usr = rq.body.username;
    const pwd = rq.body.password;

    User.findOne({email: usr}).then((foundedUser) => {
        if (foundedUser) {
          if (foundedUser.password === pwd) {
            console.log(foundedUser.email + " => " + foundedUser.password);
            rs.render("secrets");
          } else {
            rs.redirect("/login");
          }
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