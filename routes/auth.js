const passport = require("passport");
const settings = require("../config/settings");
require("../config/passport")(passport);
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");

router.post("/login", function(req, res, next) {
  User.findOne(
    {
      email: req.body.email
    },
    function(err, user) {
      if (err) {
        return next(err);
      } else if (!user) {
        res.status(404).send({
          success: false,
          msg: "Authentication failed. User not found."
        });
      } else if (user) {
        const validPassword = user.comparePassword(req.body.password);

        if (!validPassword) {
          res.status(401).send({
            success: false,
            msg: "Authentication failed. Wrong Password"
          });
        } else if (
          user.userType !== "school-operator" &&
          user.userType !== "school-admin"
        ) {
          res.status(403).send({
            success: false,
            msg:
              "Authentication failed. Only person with proper authorization are eligible to access"
          });
        } else {
          // case when the user exists, password also matches and user.userType is one of operator of admin
          // so now create the encrypted token to be sent to the client that client will sent back along with each request to access protected routes
          const token = jwt.sign(
            {
              email: user.email,
              id: user._id
            },
            settings.secret,
            {
              expiresIn: req.body.rememberMeChecked ? "72h" : "4h"
            }
          );
          // return the information including token as JSON and the imageUrl as an additional data-point so I can get it in the front end to be renderer in the header for the logged-in user

          res.json({
            success: true,
            message: "Token Acquired",
            token: "JWT " + token,
            imageUrl: user.images.original_image,
            userType: user.userType,
            email: user.email,
            name: user.firstName,
            _id: user._id
          });
        }
      }
    }
  );
});

module.exports = router;

/* The flow of the authentication process with token

When the user makes login request
1. The server verifies if the user is legit and responds with a token (JWT) containing the identity of the user.
2. The token in response is stored locally in the client system (localStorage in this case), and the user is allowed inside the application.
3. When the user makes changes to his profile (or any other resources), his profile [data + token] is sent to the server.
4. The server first checks if the request contains the token (responds with an error if not passed). The token is then verified, once done then the profile data from the payload is checked and respective changes are made to the database.
5. Its same for all the other actions made by the user.
6. When the user “logs out” the identification token is destroyed from the localStorage.

*/

/*
1> First - To check the /login route in Postman (when I dont have the sign-up module yet), first I generate an hash password for 'abc' by running the below code in an independent .js file located in /server directory. Only purpose of this file is to generate a hash to be saved in step-2 to Mongodb

const bcrypt = require("bcrypt");

const myPlaintextPassword = "abc";
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(myPlaintextPassword, salt, function(err, hash) {
        console.log(hash);
    });
});

The console-logged 'hash' value is the one, that I have to save in Mongo


2> Second,  I manually inserted an user, into mongodb 'users' collection with the below details

db.users.insert({
	"email": "rohanpaul2@gmail.com",
	"password" : "$2b$10$xL6RRh9/WHI5Jlartab32.7ED.y3aOSLQ9teprLD.VBe9hgqaYN.W",
	"firstName": "rohan",
    "lastName": "paul",
	"loginAttempts": "2",
	"userType":"Port",
	"images": {
        "original_image": "http://smartport.ap.gov.in:9000/smartport-profile/c56bb560-b1a5-11e7-8c59-e5b9b711918dvessel-placeholder.png"
    }
})

3> Third - Then from postman I send a POST request to < http://localhost:3000/api/auth/login >

{
	"email": "abc@live.in",
	"password":"abc"
}

*/
