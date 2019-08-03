const express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    gcsUpload = require('./gcsupload'),
    request = require('request');

var main = path.resolve("./frontend/html/home.html"),
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

app.post('/mainimage',gcsUpload.uploadBig.single('image',new Object),gcsUpload.uploadToGCSMain,function(req,res,next){
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  // console.log("\n",data.imageUrl);
  res.send(data.imageUrl);
});

app.post('/resizeimages',gcsUpload.uploadSmall.array('images',new Object),gcsUpload.uploadToGCSSmall,function(req,res,next){
  let data = req.body;

  if (req.files && req.files.imgUrls) {
    data.imageUrls = req.files.imgUrls;
  }

  // console.log("\n",imgUrls);
  res.send(data.imgUrls);
});

app.get('/getimages',function(req,res,err){
  gcsUpload.getImages()
  .then((resolveData)=>{
    // console.log("images",resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.get('/deleteimages',function(req,res,err){
  gcsUpload.deleteImages()
  .then((resolveData)=>{
    console.log(resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    console.log(rejectData);
    res.send(rejectData);
  })
});
<<<<<<< HEAD
=======


app.get('/newsession',function(req,res,err){
  createSession()
  .then((resolveData)=>{
    console.log(resolveData);
    gcsUpload.setSessionId(resolveData[2]);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

function createSession(){
  return new Promise((resolve,reject)=>{
    request('https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', { json: true }, (err, res, body) => {
      if (err) { return reject(err); }
      resolve(res.body);
    })
  });
}

app.post('/delete-session',function(req,res,err){
  console.log(req.body.sessionId);
  deleteSession(req.body.sessionId)
  .then((resolveData)=>{
    console.log(resolveData);
    return gcsUpload.deleteImages()
  })
  .then((resolveData)=>{
    console.log(resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

function deleteSession(id){
  console.log(id);
  return new Promise((resolve,reject)=>{
    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
      form:{sessionId:id},
      json: true,
    }, (err, res, body) => {
      if (err) { return reject(err); }
      resolve(res.body);
    })
  });
}



>>>>>>> 637c59901a0ce0f3866b583fbc85ef4607aa39f2
