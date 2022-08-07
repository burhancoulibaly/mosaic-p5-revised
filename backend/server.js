const express = require("express");
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const bodyParser = require("body-parser");
const { verifyUser } = require('./firebase/auth.js');
const multerUpload = require('./multerupload.js');
const { cleanStorage } = require('./firebase/cleanStorage.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

setInterval(cleanStorage, 24 * 60 * 60 * 1000);

app.use(express.static(path.join(__dirname, '../dist')));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get("/", function(req, res){
  res.sendFile(path.resolve(__dirname, 'index.html'));
})

app.post('/uploadmain', verifyUser, multerUpload.uploadMain().single('image'), function(req,res){
  if(!req.file){
    res.send();
  }

  res.send(req.file);
});

app.post('/uploadimages', verifyUser, multerUpload.uploadImages().array('images'), function(req,res){
  if(!req.files){
    res.send();
  }

  res.send(req.files);
});

app.post(
  '/deleteimages',  
  verifyUser,
  multerUpload.uploadMain().storage.removeFiles, 
  multerUpload.uploadImages().storage.removeFiles, 
function(req, res){
  if(req.payload && req.payload.uid){
    res.send({status: "Success", response: `All images for user ${req.payload.uid} have been deleted`})
  }else{
    res.send({});
  }
});













