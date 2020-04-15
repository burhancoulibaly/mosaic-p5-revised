const express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app),
    Promise = require('bluebird');
    fs = Promise.promisifyAll(require('fs')),
    bodyParser = require("body-parser"),
    mkdirp = require('mkdirp'),
    request = require('request'),
    cookieParser = require('cookie-parser'),
    sharp = require("sharp"),
    gcsUpload = require('./gcsupload'),
    fetch = require("node-fetch");

    main = path.resolve("./frontend/html/home.html"),
    css = path.resolve("./frontend/css"),
    js = path.resolve("./frontend/js"),
    bootstrap = path.resolve("./node_modules/bootstrap/dist"),
    jquery = path.resolve("./node_modules/jquery/dist"),
    p5js = path.resolve("./node_modules/p5/lib"),
    images = path.resolve("./stock_images");

app.use("/main", express.static(main));
app.use("/css", express.static(css));
app.use("/js", express.static(js));
app.use("/bootstrap", express.static(bootstrap));
app.use("/p5js", express.static(p5js));
app.use("/jquery", express.static(jquery));
app.use("/images", express.static(images));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://mosaic-p5-demo.herokuapp.com/"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

server.listen(process.env.PORT || 3000);
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
})


app.get('/get-images',async function(req,res){
  fs.readdir(images+"/images", function(err, retrievedImages){
    if(err){
      res.send("Could not list your directory.", err);
      process.exit(1);
    }
    
    res.send(retrievedImages);
  })
})

app.post('/upload-resized-images',async function(req,res,next){
  let imageNames = req.body.images;
  let resizedImages = new Array();

  try{
    result = await Promise.all(imageNames.map(async(imageName) => {
                resizedImage = await gcsUpload.uploadResizedImage(imageName);
                resizedImages.push(resizedImage);
              }));
  }catch(err){
    res.send(err);
  }

  console.log(resizedImages);
  res.send(resizedImages);
});

app.get('/get-resized-images',function(req,res,err){
  gcsUpload.getResizedImages()
  .then((resolveData)=>{
    // console.log("images",resolveData);
    res.send(resolveData);
  })
  .catch((rejectData)=>{
    res.send(rejectData);
  })
});

app.get('/delete-images',function(req,res,err){
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