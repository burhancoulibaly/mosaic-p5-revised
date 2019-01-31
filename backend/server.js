var express = require("express"),
    app = express(),
    path = require("path"),
    server = require('http').createServer(app);
    fs = require('fs');


var main = path.resolve("./frontend/html/home.html"),
    css = path.resolve("./frontend/css"),
    js = path.resolve("./frontend/js"),
    bootstrap = path.resolve("./node_modules/bootstrap/dist"),
    jquery = path.resolve("./node_modules/jquery/dist"),
    p5js = path.resolve("./node_modules/p5/lib");
    images = path.resolve("./frontend/images");

app.use("/main", express.static(main));
app.use("/css", express.static(css));
app.use("/js", express.static(js));
app.use("/bootstrap", express.static(bootstrap));
app.use("/p5js", express.static(p5js));
app.use("/jquery", express.static(jquery));
app.use("/images", express.static(images));

server.listen(process.env.PORT || 3000);
console.log("Server running on port: 3000");

app.get('/',function(req,res){
  res.sendFile(main);
})

app.get('/getimages',function(req,res){
  fs.readdir(images+"/stock_images", function(err, images){
    if(err){
      console.error("Could not list your directory.", err);
      process.exit(1);
    }
    res.send(images);
  })
})

app.get('/getmainimages',function(req,res){
  fs.readdir(images+"/main_image", function(err, images){
    if(err){
      console.error("Could not list your directory.", err);
      process.exit(1);
    }
    res.send(images);
  })
})
