const express = require("express"),
    session = require('express-session'); 
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    SessionManager = require("./session_manager"),
    request = require('request'),
    StorageGCS = require("./storage"),
    sessions = new Object(),
    storageGCS = new StorageGCS,
    cookieParser = require('cookie-parser')

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
app.use(cookieParser())
app.use(session({
  secret: 'ssshhhhh',
  resave: false,
  saveUninitialized: true
}));

server.listen(process.env.PORT || 3000);
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
  //todo check if sessionObj.sessionManager is null if so send error page saying unable to create socket connection
});

app.get('/createsession', async function(req,res,err){
  if(sessions[req.sessionID]){
    try{
      image_names = await sessions[req.sessionID].sessionManager.getImageURLS(req.sessionID);
      console.log(image_names)
      if(image_names.length > 0){
        deleteInfo = await sessions[req.sessionID].sessionManager.imageDeletion(image_names);
        console.log(deleteInfo);

        sessionDelInfo = await sessions[req.sessionID].sessionManager.deleteImageLinks(req.sessionID)
        console.log(sessionDelInfo[1]);

        res.send("This session with the id: "+req.sessionID+" already exist in another tab, removing images form GCP, and ending process in other tab");
        return "This session with the id: "+req.sessionID+" already exist in another tab, removing images form GCP, and ending process in other tab"
      }

      //Add function that stops anythin running on current session here

      res.send("This session with the id: "+req.sessionID+" already exist in another tab");
      return "This session with the id: "+req.sessionID+" already exist in another tab"
    }catch(err){
      res.send(err);
      return err;
    }
  }else{
    sessionObj = new Object();

    sessionObj.storageGCS = storageGCS;
    sessionObj.sessionManager = new SessionManager(sessionObj.storageGCS.getStorage);

    try{
      await sessionObj.sessionManager.createSession(req.sessionID)
      sessionObj.imageUrlsToStore = new Array();
      console.log("New Session: "+ req.sessionID);
      sessions[req.sessionID] = sessionObj;

      res.send("New Session: "+ req.sessionID)
      return "New Session: "+ req.sessionID

    }catch(err){
      console.log(err);
      res.send(err);
      return err
    }
  }
});

app.post('/mainimage',storageGCS.getUploadBig.single('image',new Object),uploadToGCSMain,function(req,res,next){
  if (req.file && req.file.cloudStorageUrl) {
    imageUrl = null;
    imageUrl = req.file.cloudStorageUrl;
  }

  sessions[req.sessionID].imageUrlsToStore = new Array();
  sessions[req.sessionID].imageUrlsToStore.push(imageUrl);

  console.log("\n",imageUrl);
  res.send(imageUrl);
});

app.post('/resizeimages',storageGCS.getUploadSmall.array('images',new Object),uploadToGCSSmall,function(req,res,next){
  if (req.files && req.files.cloudStorageUrls) {
    imageUrls = null;
    imageUrls = req.files.cloudStorageUrls;
  }

  sessions[req.sessionID].imageUrlsToStore.push(imageUrls)

  console.log(sessions[req.sessionID].imageUrlsToStore);

  sessions[req.sessionID].sessionManager.storeImages(req.sessionID, sessions[req.sessionID].imageUrlsToStore[0], sessions[req.sessionID].imageUrlsToStore[1])
  .then((resolveData)=>{
    console.log(resolveData);

    console.log("\n",imageUrls);
    res.send(imageUrls);
    return resolveData;
  })
  .catch((rejectData)=>{
    res.send(rejectData);
    return rejectData;
  })
});

app.get('/getimages',async function(req,res,err){
  try{
    imageUrls = await sessions[req.sessionID].sessionManager.getImageURLS(req.sessionID);

    if(imageUrls[0] && imageUrls[1]){
      images = await sessions[req.sessionID].sessionManager.getImages(imageUrls);

      res.send(images);
      return "All images recieved"
    }

    res.send("Unable to retrieve images");
    return "Unable to retrieve images";
  }catch(err){
    res.send(err);
    return err;
  }
});

app.get('/deleteSession', async function(req,res,err){
  console.log("hello")
  try{
    console.log("deleting session");
    image_names = await sessions[req.sessionID].sessionManager.getImageURLS(req.sessionID);

    if(image_names[0] && image_names[1]){
      console.log("Deleting Images for session: "+ req.sessionID);
      deleteInfo = await sessionManager.imageDeletion(image_names);
      console.log(deleteInfo);
    }

    sessionDelInfo = await sessions[req.sessionID].sessionManager.deleteSession(req.sessionID)
    console.log(resolveData);
    
    delete sessions[req.sessionID];
    
    res.send(resolveData);
    return "Session and it's images deleted";
  }catch(err){  
    res.send("Unable to delete session: ",err);
    return "Unable to delete session: ",err;
  }
});

function uploadToGCSMain(req,res,next){
  if (!req.file) {
    return next();
  }
  req.file.cloudStorageUrl = null;

  console.log(req.sessionID)

  req.file.cloudStorageUrl = req.file.path;
  next();
}

function uploadToGCSSmall(req,res,next){
  if (!req.files) {
      return next();
  }

  req.files.cloudStorageUrl = null;
  
  let imgUrls = new Array();

  for(var i = 0;i < req.files.length;i++){
      imgUrls.push(req.files[i].path);
  }

  req.files.cloudStorageUrls = imgUrls;
  next();
}

// function getSessionId(cookies){
//   return new Promise(async (resolve,reject)=>{
//       console.log(cookies)
//       if(!cookies){
//           reject("Unable to recieve sessionId, try turning on cookies");
//       }

//       resolve(cookies['connect.sid'])
//   });
// }













