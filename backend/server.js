const express = require("express"),
    app = express(),
    path = require("path"),
    multer = require('multer'),
    sharp = require("sharp"),
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

let resizeBuff = new Array();

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

const storageSmall = multer.memoryStorage({
  limits:{
    fileSize: 16 * 1024 * 1024
  }
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
  // fs.readdir(allImages+"/resized_images", function(err, smallImages){
  //   if(err){
  //     console.error("Could not list your directory.", err);
  //     process.exit(1);
  //   }else{
  //     fs.readdir(allImages+"/main_image", function(err, mainImage){
  //       if(err){
  //         console.error("Could not list your directory.", err);
  //         process.exit(1);
  //       }else{
  //         images = [mainImage,smallImages];
  //         res.send(images);
  //       };
  //     });
  //   };
  // });
});

app.post('/mainimage',uploadBig.single('image',new Object),gcsUpload.uploadToGCS,function(req,res,next){
  let data = req.body;
  if (req.file && req.file.cloudStoragePublicUrl) {
    data.imageUrl = req.file.cloudStoragePublicUrl;
  }
  res.send("image uploaded");
});

app.post('/resizeimages',upload.array('images',new Object),function(req,res,err){
  if(err){
    res.send(err);
  }else{
    resizeImages(req.files)
    .then((resolveData)=>{
      console.log(resolveData);
      res.send(resolveData);
    })
    .catch((err)=>{
      console.log(err,"ypp1")
      res.send(err,"ypp");
    });
  };
});

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucketName+'/'+filename;
}

async function resizeImages(images){
  let count = 0
  await Promise.all(images.map(async(image)=>{
    await resize(image)
    .then((resolveData)=>{
      count++
      resizeBuff.push(resolveData);
    })
    .catch((err)=>{
      console.log(err,"ypp5");
    });
  })); 
  console.log(count);
  console.log(resizeBuff);
};

function resize(image){
  return new Promise((resolve,reject)=>{
    // console.log(image)
    
    sharp(image)
    .flatten()
    .resize({width:100,height:100})
    .jpeg()
    .toBuffer()
    .then((data) =>{
      const gcsname = "resized_images/"+Date.now() + image.file.originalname;
      const file = bucketName.file(gcsname);

      const stream = file.createWriteStream({
        metadata: {
          contentType: data.mimetype
        },
        resumable: false
      });

      stream.on('error', (err) => {
        data.cloudStorageError = err;
        console.log(err);
      });

      stream.on('finish', () => {
        data.cloudStorageObject = gcsname;
        file.makePublic().then(() => {
          data.cloudStoragePublicUrl = getPublicUrl(gcsname);
        });
      });
      stream.end(req.file.buffer); 
    })
    .then(()=>{
      return file.makePublic()
    })
    .then(() => {
      resolve(image.file.cloudStoragePublicUrl = getPublicUrl(gcsname));
    })
    .catch((err) =>{
      reject(err);
    });
  });
};
