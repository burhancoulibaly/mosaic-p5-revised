const express = require("express"),
    app = express(),
    path = require("path"),
    multer = require('multer'),
    server = require('http').createServer(app),
    fs = require('fs'),
    bodyParser = require("body-parser"),
    ejs = require('ejs'),
    engine = require('consolidate'),
    http = require("http"),
    https = require("https"),
    sharp = require("sharp"),
    request = require("request"),
    promisePipe = require("promisepipe");

const storage = multer.diskStorage({
  destination: './frontend/images/temp_images/',
  filename: function(req, file, callback){
    callback(null,file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  }
})

const storageBig = multer.diskStorage({
  destination: './frontend/images/main_image/',
  filename: function(req, file, callback){
    callback(null,file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
  }
})

const uploadBig = multer({
  storage:storageBig
}).single('image',new Object);

// upload = multer({dest: './frontend/images/resized_images'});
const upload = multer({
  storage:storage
}).array('images',new Object);

var main = path.resolve("./frontend/html/home.html"),
    css = path.resolve("./frontend/css"),
    js = path.resolve("./frontend/js"),
    bootstrap = path.resolve("./node_modules/bootstrap/dist"),
    jquery = path.resolve("./node_modules/jquery/dist"),
    p5js = path.resolve("./node_modules/p5/lib"),
    allImages = path.resolve("./frontend/images");
    // resizedImages = path.resolve("./frontend/images/resized_images");

app.use("/main", express.static(main));
app.use("/css", express.static(css));
app.use("/js", express.static(js));
app.use("/bootstrap", express.static(bootstrap));
app.use("/p5js", express.static(p5js));
app.use("/jquery", express.static(jquery));
app.use("/images", express.static(allImages));

app.use(bodyParser.urlencoded({
  extended: true
}));

// app.use("/resized_images",express.static(resizedImages));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
})
app.use(bodyParser.json());

app.get('/getimages',function(req,res){
  fs.readdir(allImages+"/stock_images", function(err, images){
    if(err){
      console.error("Could not list your directory.", err);
      process.exit(1);
    }
    res.send(images);
  })
})

app.post('/mainimage',function(req,res){
  uploadBig(req,res,(err)=>{
    if(err){
      console.log(err)
      res.send(err);
    }else{
      res.send("image uploaded");
    }
  })
})

app.post('/resizeimages',function(req,res){
  upload(req,res,(err) =>{
    if(err){
      console.log(err)
      res.send(err);
    }else{
      // console.log(req.files);
      fs.readdir(allImages+"/temp_images", function(err, images){
        if(err){
          console.error("Could not list your directory.", err);
          process.exit(1);
        }
        imagesArr = images;
        for(var i = 0; i < imagesArr.length; i++){
          resize(images[i]);
        }
        res.send("files uploaded and resized");
      })
    }
  })
})

function resize(image){
  console.log(image)
  let inStream = fs.createReadStream(allImages+"/temp_images/"+image);
  let outStream = fs.createWriteStream(allImages+"/resized_images/"+image, {flags: "w"});

  // on error of output file being saved
  outStream.on('error', function() {
    console.log("Error");
  });

  // on success of output file being saved
  outStream.on('close', function() {
    console.log("Successfully saved file");
  });

  let transform = sharp()
                  .resize({width:100,height:100})
                  .on('info', function(fileInfo){
                    console.log("resizing complete")
                  })

  inStream.pipe(transform).pipe(outStream);

}

 // let image = JSON.stringify(req.body);
  // console.log(image);
  // let image = fs.createWriteStream(allImages+"/resized_images/image.jpg", {flags: "w"}).write(imageBuffer);
  // // on error of output file being saved
  // image.on('error', function() {
  //   console.log("Error");
  // on success of output file being saved
  // image.on('close', function() {
  //   console.log("Successfully saved file");
  //   res.send("done");
  // });


  
  // console.log(image);
  // error = false
  // async function resize(){
  //   await http.get("http://localhost:3000/images/stock_images/"+image, function(downloadStream){
  //     downloadStream.pipe(sharp().resize(100,100).toFile(,(err,info)=>{
  //       if(err){
  //         console.log(err);
  //         error = true
  //       }else{
  //         console.log(info);
  //       }
  //     }));
  //     downloadStream.on('end', () => {
  //       console.log("downloadStream","end")
  //     });
  //     downloadStream.on('error', (err) => {
  //       console.log('downloadStream', err);
  //     });
  //   });
  //   if(error == false){
  //     console.log("hello");
  //    Promise.resolve("done");
  //   }else{
  //     Promise.reject("error")
  //   }
  // }
  // resize()
  // .then(function(response){
  //   res.send(response)
  // })
  // .catch(function(err){
  //   res.send(err)
  // })