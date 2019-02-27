const express = require("express"),
    app = express(),
    path = require("path"),
    multer = require('multer'),
    gcsSharp = require('multer-sharp'),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp');
    gcsUpload = require('./gcsupload');

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

const storageSmall = gcsSharp({
  filename: (req, file, cb) => {
    cb(null,"resized_images/"+file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  },
  bucket:"gs://mosaic-p5-database.appspot.com",
  projectId:'Mosaic-P5',
  keyFilename:'./mosaic-p5-database-firebase-adminsdk-0558w-e260b73db6.json',
  acl: 'publicRead',
  size:{
    width:100,
    height:100
  },
  max:true
});

const storageBig = multer.memoryStorage({
  limits:{
    fileSize: 16 * 1024 * 1024
  }
});

const uploadBig = multer({
  storage:storageBig
});

const upload = multer({
  storage:storageSmall
});

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
});

app.get('/getimages',function(req,res){
  res.send("shits on gcs")
});

app.post('/mainimage',uploadBig.single('image',new Object),gcsUpload.uploadToGCS,function(req,res,next){
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  console.log("\n",data.imageUrl);
  res.send(data.imageUrl);
});

app.post('/resizeimages',upload.array('images',new Object),function(req,res,next){
  imgUrls = new Array();
  for(var i = 0;i < req.files.length;i++){
    imgUrls[i] = "https://storage.googleapis.com/mosaic-p5-database.appspot.com/"+req.files[i].filename;
  }
  console.log("\n",imgUrls);
  res.send(imgUrls);
});
