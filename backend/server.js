const express = require("express"),
    app = express(),
    path = require("path"),
    multer = require('multer'),
    {Storage} = require('@google-cloud/storage'),
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

const storage = new Storage({
  projectId:'Mosaic-P5',
  keyFilename:'./keyfile.json'
})

const bucket = storage.bucket('gs://mosaic-p5-database.appspot.com');

const storageSmall = gcsSharp({
  filename: (req, file, cb) => {
    cb(null,"resized_images/"+file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  },
  bucket:"gs://mosaic-p5-database.appspot.com",
  projectId:'Mosaic-P5',
  keyFilename:'./keyfile.json',
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

app.post('/mainimage',uploadBig.single('image',new Object),gcsUpload.uploadToGCS,function(req,res,next){
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  // console.log("\n",data.imageUrl);
  res.send(data.imageUrl);
});

app.post('/resizeimages',upload.array('images',new Object),function(req,res,next){
  imgUrls = new Array();
  for(var i = 0;i < req.files.length;i++){
    imgUrls[i] = "https://storage.googleapis.com/mosaic-p5-database.appspot.com/"+req.files[i].filename;
  }
  // console.log("\n",imgUrls);
  res.send(imgUrls);
});

app.get('/getimages',function(req,res,err){
  getImages()
  .then((resolveData)=>{
    // console.log(resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.get('/deleteimages',function(req,res,err){
  deleteImages()
  .then((resolveData)=>{
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

async function deleteImages(){
  return new Promise(async(resolve,reject)=>{
    const [imgsToDelete] = await bucket.getFiles();

    if(imgsToDelete.length == 0){
      resolve("Empty Bucket");
    }

    await Promise.all(imgsToDelete.map(async(img)=>{
      await bucket.file(img.metadata.name).delete()
            .then(()=>{
              resolve("complete");
            })
            .catch((err)=>{
              reject(err);
            })
    }));

  });
};

async function getImages(){
  return new Promise(async(resolve,reject)=>{
    const mainFolder = "main_image";
    const resizeFolder = "resized_images";

    const delimeter = "/";

    const optionsMain = {
      prefix:mainFolder,
      delimeter:delimeter
    }

    const optionsResize = {
      prefix:resizeFolder,
      delimeter:delimeter
    }

    const [imageMain] = await bucket.getFiles(optionsMain);
    const [imagesResized] = await bucket.getFiles(optionsResize);
    
    resolve([imageMain,imagesResized]);
  })
}
