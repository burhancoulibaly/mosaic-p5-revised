const express = require("express");
const app = express();
const server = require('http').createServer(app);
const bodyParser = require("body-parser");
const cors = require("cors");
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../webpack.config.js');
const { verifyUser } = require('./firebase/auth.js');
const multerUpload = require('./multerupload.js');

let whitelist = ['http://localhost:3000'];

const corsOptions = {
  //Checks if origin is in whitelist if not an error is returned
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || (!process.env.NODE_ENV || process.env.NODE_ENV === "development")) {
        callback(null, true)
    } else {
        callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
};

const compiler = webpack(webpackConfig);
const imageUrls = {}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
  })
)
app.use(verifyUser); 

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.post('/uploadmain', multerUpload.uploadMain().single('image'), function(req,res){
  if(!req.file){
    res.send();
  }

  imageUrls[req.payload.uid] = req.file;

  res.send(req.file);
});

app.post('/uploadimages', multerUpload.uploadImages().array('images'), function(req,res){
  if(!req.files){
    res.send();
  }

  imageUrls[req.payload.uid] = req.files;

  res.send(req.files);
});

app.get(
  '/deleteimages',  
  multerUpload.uploadMain().storage.removeFiles, 
  multerUpload.uploadImages().storage.removeFiles, 
function(req, res){
  res.send({status: "Success", response: `All images for user ${req.payload.uid} have been deleted`})
});













