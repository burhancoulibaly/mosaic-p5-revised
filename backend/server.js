const express = require("express");
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require("body-parser");
const axios = require('axios');
const { reCAPTCHASec } = require('../config/config.js');
const querystring = require('node:querystring');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, '../dist')));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get("/", function(req, res){
  res.sendFile(path.resolve(__dirname, 'index.html'));
})

app.post("/validateCaptcha", function(req, res){
  if(!req.body.token){
    res.send({
      status: "Error",
      message: "Token missing"
    })
  }

  axios
    .post("https://www.google.com/recaptcha/api/siteverify", querystring.stringify({
        secret: reCAPTCHASec,
        response: req.body.token
    }))
    .then((response) => {
      res.send({
        status: "Success",
        message: {
          success: response.data.success
        }
      })
    })
    .catch((error) => {
      res.send({
        status: error.code,
        message: error.message
      })
    })

})















