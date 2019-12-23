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
    StorageGCS = require("./storage");
    sessions =  new Object();

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
app.use(session({
  secret: 'ssshhhhh',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

server.listen(process.env.PORT || 3000);
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
});

app.get('/createsession', function(req,res,err){
  if(sessions[req.session.id]){
    sessions[req.session.id][0].sessionManager.imageDeletion()
    .then((resolveData)=>{
      // console.log(resolveData);
      console.log(resolveData);
    })
    .catch((rejectData)=>{
      // console.log(rejectData);
      console.log(rejectData);
    })
    req.session.sessionManager = new SessionManager(req.session.id)
    req.session.sessionManager.createSession()
    .then((resolveData)=>{
      sessionId = req.session.id;
      console.log("New session tab: "+sessionId);
      req.session.save();
      sessions[sessionId].push(req.session);
      console.log(sessions);
    })
    .catch((err)=>{
      console.log(err);
    });
  }else{
    req.session.sessionManager = new SessionManager(req.session.id)
    req.session.sessionManager.createSession()
    .then((resolveData)=>{
      sessionId = req.session.id;
      console.log("New Session: "+sessionId);
      req.session.save();
      sessions[sessionId] = [req.session];
      console.log(sessions);
    })
    .catch((err)=>{
      console.log(err);
    });
  }

  app.post('/mainimage',req.session.sessionManager.getUploadBig.single('image',new Object),uploadToGCSMain,function(req,res,next){
    let data = req.body;
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }
    // console.log("\n",data.imageUrl);
    res.send(data.imageUrl);
  });
  
  app.post('/resizeimages',req.session.sessionManager.getUploadSmall.array('images',new Object),uploadToGCSSmall,function(req,res,next){
  let data = req.body;
  
  if (req.files && req.files.imgUrls) {
    data.imageUrls = req.files.imgUrls;
  }
  
  // console.log("\n",imgUrls);
  res.send(data.imgUrls);
  });

  res.send(req.session.id);
});

app.get('/getimages',function(req,res,err){
  sessions[req.session.id][0].sessionManager.getImages()
  .then((resolveData)=>{
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.post('/delete-session',function(req,res,err){
  if(sessions[req.body.sessionId].length > 1){
    sessions[req.body.sessionId][0].sessionManager.imageDeletion()
    .then((resolveData)=>{
      // console.log(resolveData);
      console.log(resolveData);
    })
    .catch((rejectData)=>{
      // console.log(rejectData);
      console.log(rejectData);
    })

    sessions[req.body.sessionId].pop();

    console.log("session tab closed");

    res.send("session tab closed");
  }else{
    if (req.session){
      req.session.destroy(function(err) {
  
        console.log(req.body);
        if(err){
          console.log(err);
        }
    
        sessions[req.body.sessionId][0].sessionManager.imageDeletion()
        .then((resolveData)=>{
          // console.log(resolveData);
          console.log(resolveData);
        })
        .catch((rejectData)=>{
          // console.log(rejectData);
          console.log(rejectData);
        })
    
        sessions[req.body.sessionId][0].sessionManager.deleteSession()
        .then((resolveData)=>{
          // delete req.session.sessionManager;
          console.log(resolveData);
        })
        .catch((rejectData)=>{
          console.log(rejectData);
        })
    
        delete sessions[req.body.sessionId];
    
        console.log("Session Destroyed");
  
        res.send("session destroyed");
      })
    }
  }
});

// app.post('/deletesession',function(req,res,next){
//   console.log("hello");
//   req.session.destroy(function(err) {

//     console.log(req.session.id);
//     if(err){
//       console.log(err);
//     }

//     sessions[req.session.id][0].sessionManager.imageDeletion()
//     .then((resolveData)=>{
//       // console.log(resolveData);
//       console.log(resolveData);
//     })
//     .catch((rejectData)=>{
//       // console.log(rejectData);
//       console.log(rejectData);
//     })

//     sessions[req.session.id][0].sessionManager.deleteSession()
//     .then(()=>{
//       // delete req.session.sessionManager;
//       console.log(resolveData);
//     })
//     .catch((rejectData)=>{
//       console.log(rejectData);
//     })


//     console.log("Session Destroyed")
//   })
// });

function uploadToGCSMain(req,res,next){
  if (!req.file) {
    return next();
  }
  
  const gcsName = sessions[req.session.id][0].id+"/main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);

  req.file.cloudStoragePublicUrl = sessions[req.session.id][0].sessionManager.getPublicUrl(gcsName);
  next();
}

function uploadToGCSSmall(req,res,next){
  if (!req.files) {
      return next();
  }
  
  let imgUrls = new Array();
  
  for(var i = 0;i < req.files.length;i++){
      const gcsName = sessions[req.session.id][0].id+"/resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);

      imgUrls[i] = sessions[req.session.id][0].sessionManager.getPublicUrl(gcsName);
  }
  
  req.files.cloudStoragePublicUrl = imgUrls;
  next();
}




















