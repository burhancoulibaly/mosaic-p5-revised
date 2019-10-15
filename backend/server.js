const express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    SessionManager = require("./session_manager");
    request = require('request');

    sessionManager = new SessionManager();
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
  sessionId = sessionManager.getSessionId;
  console.log(sessionId);
  res.send(sessionId);
});

app.get('/deleteimages',function(req,res,err){
  sessionManager.imageDeletion()
  .then((resolveData)=>{
    console.log(resolveData);
    return resolveData;
  })
  .catch((rejectData)=>{
    console.log(rejectData);
    return rejectData;
  })
});

app.post('/mainimage',sessionManager.getUploadBig.single('image',new Object),uploadToGCSMain,function(req,res,next){
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  // console.log("\n",data.imageUrl);
  res.send(data.imageUrl);
});

app.post('/resizeimages',sessionManager.getUploadSmall.array('images',new Object),uploadToGCSSmall,function(req,res,next){
  let data = req.body;

  if (req.files && req.files.imgUrls) {
    data.imageUrls = req.files.imgUrls;
  }

  // console.log("\n",imgUrls);
  res.send(data.imgUrls);
});

app.get('/getimages',function(req,res,err){
  sessionManager.getImages()
  .then((resolveData)=>{
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.get('/delete-session',function(req,res,err){
  console.log(sessionManager.getSessionId);
  sessionManager.deleteSession()
  .then(()=>{
    return this.deleteImages();
  })
  .then((resolveData)=>{
    return resolveData;
  })
  .catch((rejectData)=>{
    return rejectData;
  })
});

function uploadToGCSMain(req,res,next){
  if (!req.file) {
    return next();
  }
  
  const gcsName = sessionManager.getSessionId+"/main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);

  req.file.cloudStoragePublicUrl = sessionManager.getPublicUrl(gcsName);
  next();
}

function uploadToGCSSmall(req,res,next){
  if (!req.files) {
      return next();
  }
  
  let imgUrls = new Array();
  
  for(var i = 0;i < req.files.length;i++){
      const gcsName = sessionManager.getSessionId+"/resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);

      imgUrls[i] = sessionManager.getPublicUrl(gcsName);
  }
  
  req.files.cloudStoragePublicUrl = imgUrls;
  next();
}















