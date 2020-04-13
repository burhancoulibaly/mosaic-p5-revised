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
    sharp = require("sharp");

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

server.listen(process.env.PORT || 3000);
// console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
})


app.get('/getimages',function(req,res){
  fs.readdir(images+"/images", function(err, retrievedImages){
    if(err){
      console.error("Could not list your directory.", err);
      process.exit(1);
    }
    res.send(retrievedImages);
  })
})

app.post('/resizeimages',async function(req,res){
  let images = req.body.images;
  let resizedImages = new Array();

  try {
    await Promise.all(images.map(async(image) => {
      resizedImage = await resizeImage(image)
      resizedImages.push(resizedImage);
    }));
  }catch(err){
    res.send(err);
  }

  console.log(resizedImages);

  res.send(resizedImages);
})

function resizeImage(image){
  return new Promise((resolve,reject) => {
    try {
      let inStream = fs.createReadStream(images+"/images/"+image);
      let outStream = fs.createWriteStream(images+"/resized_images/"+image, {flags: "w"});

      // on error of output file being saved
      outStream.on('error', function(error) {
        reject("Error: ", error);
      });

      // on success of output file being saved
      outStream.on('close', function() {
        resolve("Successfully saved file");
      });

      let transform = sharp().resize({width:100,height:100});

      inStream.pipe(transform).pipe(outStream);
    }catch(err){
      reject(err);
    }
  })
}