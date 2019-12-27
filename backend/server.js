const express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    SessionManager = require("./session_manager"),
    request = require('request'),
    io = require('socket.io')(server),
    StorageGCS = require("./storage"),
    sessions = new Object();

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
app.set('io',io);

server.listen(process.env.PORT || 3000);
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
  //todo check if socket.sessionManager is null if so send error page saying unable to create socket connection
});

io.on('connection', function(socket){
  socket.sessionManager = new SessionManager(socket.id);
  socket.storageGCS = new StorageGCS(genFolderId());
  socket.folderId = socket.storageGCS.getFolderId;
  socket.sessionManager.createSession()
  .then((resolveData)=>{
    socket.sessionId = socket.id;
    console.log("New Session: "+ socket.sessionId);
    console.log("New Image Folder: "+ socket.folderId);
    sessions[socket.sessionId] = socket;
    io.sockets.emit('New Session', socket.sessionId);
  })
  .catch((err)=>{
    console.log(err);
  });

    app.post('/mainimage',socket.storageGCS.getUploadBig.single('image',new Object),uploadToGCSMain,function(req,res,next){
        let data = req.body;
        if (req.file && req.file.cloudStoragePublicUrl) {
        data.imageUrl = req.file.cloudStoragePublicUrl;
        }
        // console.log("\n",data.imageUrl);
        res.send(data.imageUrl);
    });

    app.post('/resizeimages',socket.storageGCS.getUploadSmall.array('images',new Object),uploadToGCSSmall,function(req,res,next){
        let data = req.body;

        if (req.files && req.files.imgUrls) {
        data.imageUrls = req.files.imgUrls;
        }

        // console.log("\n",imgUrls);
        res.send(data.imgUrls);
    });

    app.get('/getimages',function(req,res,err){
        req.app.get("io").sockets.sockets[req.headers.path].sessionManager.getImages(req.app.get("io").sockets.sockets[req.headers.path].folderId)
        .then((resolveData)=>{
        res.send(resolveData);
        })
        .catch((rejectData)=>{
        res.send(rejectData);
        })
    });

    function uploadToGCSMain(req,res,next){
        if (!req.file) {
        return next();
        }
        
        const gcsName = req.app.get("io").sockets.sockets[req.headers.path].folderId+"/main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
        
        req.file.cloudStoragePublicUrl = req.app.get("io").sockets.sockets[req.headers.path].sessionManager.getPublicUrl(gcsName);
        next();
    }

    function uploadToGCSSmall(req,res,next){
        if (!req.files) {
            return next();
        }
        
        let imgUrls = new Array();
        
        for(var i = 0;i < req.files.length;i++){
            const gcsName = req.app.get("io").sockets.sockets[req.headers.path].folderId+"/resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);

            imgUrls[i] = req.app.get("io").sockets.sockets[req.headers.path].sessionManager.getPublicUrl(gcsName);
        }
        
        req.files.cloudStoragePublicUrl = imgUrls;
        next();
    }

  socket.on('disconnect', function(){
    sessions[socket.sessionId].sessionManager.imageDeletion(sessions[socket.sessionId].folderId)
    .then((resolveData)=>{
    //   console.log(resolveData);
      return resolveData;
    })
    .catch((rejectData)=>{
      // console.log(rejectData);
      return rejectData;
    })

    sessions[socket.sessionId].sessionManager.deleteSession()
    .then((resolveData)=>{
      console.log(resolveData[0]);
      console.log("Deleting Image Folder: "+ sessions[socket.sessionId].folderId);
      delete sessions[socket.sessionId];
      return resolveData[1];
    })
    .catch((rejectData)=>{
      return rejectData;
    })
  })
});

genFolderId = function(){
    let folderId = "";
    let possible = "ABCDEFGHIJKMNPQRSTUVWXYZ123456789";

    for(let i = 0; i < 8; i++){
        folderId += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return folderId;
}















