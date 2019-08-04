const express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    Session = require('./session'),
    request = require('request');

var session = new Session();
    main = path.resolve("./frontend/html/home.html"),
    css = path.resolve("./frontend/css"),
    js = path.resolve("./frontend/js"),
    bootstrap = path.resolve("./node_modules/bootstrap/dist"),
    jquery = path.resolve("./node_modules/jquery/dist"),
    p5js = path.resolve("./node_modules/p5/lib"),
    allImages = path.resolve("./frontend/images");

app.use("/main", express.static(main));
app.use("/css", express.static(css));
app.use("/js", express.static(js));
app.use("/bootstrap", express.static(bootstrap));
app.use("/p5js", express.static(p5js));
app.use("/jquery", express.static(jquery));
app.use("/images", express.static(allImages));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
});

app.get('/newsession',function(req,res,err){
  res.send(session.getSessionId());
});

app.get('/deleteimages',function(req,res,err){
  session.deleteImages()
  .then((resolveData)=>{
    console.log(resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    console.log(rejectData);
    res.send(rejectData);
  })
});

app.post('/mainimage',session.getUploadBig().single('image',new Object),session.uploadToGCSMain,function(req,res,next){
  console.log("hello");
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  // console.log("\n",data.imageUrl);
  res.send(data.imageUrl);
});

app.post('/resizeimages',session.getUploadSmall().array('images',new Object),session.uploadToGCSSmall,function(req,res,next){
  let data = req.body;

  if (req.files && req.files.imgUrls) {
    data.imageUrls = req.files.imgUrls;
  }

  // console.log("\n",imgUrls);
  res.send(data.imgUrls);
});

app.get('/getimages',function(req,res,err){
  session.getImages()
  .then((resolveData)=>{
    // console.log("images",resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.get('/delete-session',function(req,res,err){
  session.deleteSession()
  .then((resolveData)=>{
    console.log(resolveData);
    return session.deleteImages();
  })
  .then((resolveData)=>{
    console.log(resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

















