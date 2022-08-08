const express = require("express");
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(express.static(path.join(__dirname, '../dist')));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get("/", function(req, res){
  res.sendFile(path.resolve(__dirname, 'index.html'));
})















