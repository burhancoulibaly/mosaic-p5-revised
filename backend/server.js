const express = require("express"),
    session = require('express-session'),
    app = express(),
    cookie = require("cookie"),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    SessionManager = require("./session_manager"),
    request = require('request'),
    io = require('socket.io')(server),
    sessions = new Object();

    main = path.resolve("./frontend/html/home.html"),
    css = path.resolve("./frontend/css"),
    js = path.resolve("./frontend/js"),
    bootstrap = path.resolve("./node_modules/bootstrap/dist"),
    jquery = path.resolve("./node_modules/jquery/dist"),
    p5js = path.resolve("./node_modules/p5/lib"),
    allImages = path.resolve("./frontend/images");

app.use(session({secret: 'ssshhhhh'}));
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
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  req.session.sessionManager = new SessionManager()
  req.session.sessionManager.createSession()
  .then((resolveData)=>{
    sessionId = req.session.sessionManager.getSessionId;
    console.log("New Session: "+sessionId);
  })
  .catch((err)=>{
    console.log(err);
  });

  res.sendFile(main);
  //todo check if socket.sessionManager is null if so send error page saying unable to create socket connection
});

app.get('/getimages',function(req,res,err){
  req.session.sessionManager.getImages()
  .then((resolveData)=>{
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.post('/mainimage',getUploadBig,uploadToGCSMain,function(req,res,next){
    let data = req.body;
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }
    // console.log("\n",data.imageUrl);
    res.send(data.imageUrl);
});

app.post('/resizeimages',getUploadBig,uploadToGCSSmall,function(req,res,next){
  let data = req.body;

  if (req.files && req.files.imgUrls) {
    data.imageUrls = req.files.imgUrls;
  }

  // console.log("\n",imgUrls);
  res.send(data.imgUrls);
});

function getUploadBig(req,res,next){
  req.file = req.session.sessionManager.getUploadBig.single('image',new Object);
  next();
}

function getUploadBig(req,res,next){
  req.files = req.session.sessionManager.getUploadSmall.array('images',new Object);
  next();
}

function uploadToGCSMain(req,res,next){
  if (!req.file) {
    return next();
  }
  
  const gcsName = req.session.sessionManager.getSessionId+"/main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);

  req.file.cloudStoragePublicUrl = req.session.sessionManager.getPublicUrl(gcsName);
  next();
}

function uploadToGCSSmall(req,res,next){
  if (!req.files) {
      return next();
  }
  
  let imgUrls = new Array();
  
  for(var i = 0;i < req.files.length;i++){
      const gcsName = req.session.sessionManager.getSessionId+"/resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);

      imgUrls[i] = req.session.sessionManager.getPublicUrl(gcsName);
  }
  
  req.files.cloudStoragePublicUrl = imgUrls;
  next();
}

app.post('/deleteSession',function(req,res,next){
  req.session.destroy(function(err) {
    if(err){
      console.log(err);
    }

    req.session.sessionManager.imageDeletion()
    .then((resolveData)=>{
      // console.log(resolveData);
      console.log(resolveData);
    })
    .catch((rejectData)=>{
      // console.log(rejectData);
      console.log(rejectData);
    })

    req.session.sessionManager.deleteSession()
    .then(()=>{
      // delete req.session.sessionManager;
      console.log(resolveData);
    })
    .catch((rejectData)=>{
      console.log(rejectData);
    })


    console.log("Session Destroyed")
  })
});


















