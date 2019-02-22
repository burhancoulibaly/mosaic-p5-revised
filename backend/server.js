const express = require("express"),
    app = express(),
    path = require("path"),
    multer = require('multer'),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    sharp = require("sharp"),
    mkdirp = require('mkdirp');

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

const storage = multer.diskStorage({
  destination: './frontend/images/temp_images/',
  filename: function(req, file, callback){
    callback(null,file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  }
});

const storageBig = multer.diskStorage({
  destination: './frontend/images/main_image/',
  filename: function(req, file, callback){
    callback(null,file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  }
});

mkdirp(allImages+"/resized_images",function(err){
  if(err){
    console.log(err);
    res.send(err);
  };
});

const uploadBig = multer({
  storage:storageBig
})
.single('image',new Object);

// upload = multer({dest: './frontend/images/resized_images'});
const upload = multer({
  storage:storage
})
.array('images',new Object);

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
});

app.get('/getimages',function(req,res){
  fs.readdir(allImages+"/resized_images", function(err, smallImages){
    if(err){
      console.error("Could not list your directory.", err);
      process.exit(1);
    }else{
      fs.readdir(allImages+"/main_image", function(err, mainImage){
        if(err){
          console.error("Could not list your directory.", err);
          process.exit(1);
        }else{
          images = [mainImage,smallImages];
          res.send(images);
        };
      });
    };
  });
});

app.post('/mainimage',function(req,res){
  uploadBig(req,res,(err)=>{
    if(err){
      console.log(err);
      res.send(err);
    }else{
      res.send("image uploaded");
    };
  });
});

app.post('/resizeimages',function(req,res){
  upload(req,res,(err) =>{
    if(err){
      console.log(err);
      res.send(err);
    }else{
      // console.log(req.files);
      fs.readdirAsync(allImages+"/temp_images")
      .then((images)=>{
        return resizeImages(images);
      })
      .then((resolveData)=>{
        console.log(resolveData);
        return fs.readdirAsync(allImages+"/temp_images")
      })
      .then((resizedImages)=>{
        console.log("All images resized");
        res.send(resizedImages);
      })
      .catch((err)=>{
        console.log(err)
        res.send(err);
      });
    };
  });
});

function resizeImages(images){
  let count = 0;
  return new Promise((resolve,reject)=>{  
    images.forEach((image)=>{
      resize(image)
      .then((resolveData)=>{
        count++;
        if(count == images.length){
          resolve(resolveData);
        }
      })
      .catch((err)=>{
        reject(err);
      });
    });
  });  
};

function resize(image){
  return new Promise((resolve,reject)=>{
    console.log(image)
    sharp(allImages+"/temp_images/"+image)
    .resize({width:100,height:100})
    .jpeg()
    .toBuffer()
    .then((data) =>{
      console.log(data);
      return fs.writeFileAsync(allImages+"/resized_images/"+image, data, { flag: 'w' });
    })
    .then((info)=>{
      resolve("resize complete\n",info);
    })
    .catch((err) =>{
      reject(err);
    });
  });
};