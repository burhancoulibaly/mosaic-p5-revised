// boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
// octree = new Quad(boundary,9);
// point = new Point(155,126,143)
// octree.newPoint(point);
// console.log(octree.node.getTotalPoints(octree.node))
let boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
let mainImage;
let allImages = new Array();
let points = new Array();
let mainImgRGB = new Array();
let closeImgs = new Array();
let imgsHash = new Object;
let octree = null;
let setupStarted = false;
let drawStarted = false;
// let url = "http://localhost:3000/";
let url = "https://mosaic-p5-demo.herokuapp.com/";

$(window).on("unload", function(e) {
    deleteUploads()
    .then((resolveData)=>{
        console.log(resolveData[0]+resolveData[1]);
    })
    .catch((rejectData)=>{
        console.log(rejectData);
    });
});

getStockImages = function(){
    return new Promise((resolve,reject) => {
        const UrlGet = url+"get-stock-images";
        $.ajax({
            url: UrlGet,
            type: 'GET',
            success:function(data){
                // console.log('success',data);
                resolve(data);
            },
            error:function(error){
                reject(error);
            }
        });
    })
}

let resizeImages = function(image){
    //resizing and uploading small images
    console.log("resizing and uploading small images");
    return new Promise((resolve,reject)=>{
        const UrlPost = url+"upload-resized-image";
        $.ajax({
            url: UrlPost,
            type: 'POST',
            data: { image: image },
            success:function(data){
                resolve(data);
            },
            error:function(error){
                reject('Error',error);
            }
        });       
    });
}

let getResizedImages = function(){
    //getting all images
    console.log("getting all images");
    return new Promise((resolve,reject)=>{
        const UrlGet = url+"get-resized-images";
        $.ajax({
            url: UrlGet,
            type: 'GET',
            success:function(data){
                resolve(data);
            },
            error:function(error){
                reject('Error',error);
            }
        });
    });
}

function loadCompleteImage(image){
    return new Promise((resolve,reject) => {
        loadImage(image, async(result,error) => {
            if(error){
                reject(error)
            }
            
            resolve(result);
        })
    })
}

console.log("loading images");
console.time();
async function preload() {
    try {
        const deleteUploadsResult = await deleteUploads()
        console.log(deleteUploadsResult);

        $("#loading").html("<h1>Generating Image...</h1><br><h3>Getting Stock Images</h3>");
        const result = await getStockImages();
        const mainImageSignedUrL = result[0];
        const imgArray = result[1];
        console.log(result);

        $("#loading").html("<h1>Generating Image...</h1><br><h3>Resizing and uploading images to google cloud storage</h3>");
        const resizeImagesResult = await Promise.all(imgArray.map((img) => {
            return resizeImages(img);
        }));
        console.log(resizeImagesResult);

        $("#loading").html("<h1>Generating Image...</h1><br><h3>Getting resized images</h3>");
        const resizedImages = await getResizedImages();
        console.log(resizedImages);

        $("#loading").html("<h1>Generating Image...</h1><br><h3>Processing Images</h3>");
        mainImage = await loadCompleteImage(mainImageSignedUrL);

        await Promise.all(resizedImages.map(async(resizedImage, i) => {
            loadedImageData = await loadCompleteImage(resizedImage);
            allImages[i] = loadedImageData;
        }))

        octree = new Quad(boundary,Math.ceil(allImages.length/10));

        startSetup();
        setup();

    }catch(err){
        console.log(err);
    }
}
console.timeEnd();
console.log("Loading images end")

function setup(){
    if(setupStarted == true){
        w = mainImage.width;
        h = mainImage.height;

        pxSize = (Math.round(w/h)*5);
        canvas = createCanvas(w*2,h*2);
        canvas.position(0,0);

        console.log("Ave Img RGB")
        console.time();
        for (var i = 0; i < allImages.length; i++) {
            var red = 0;
            var green = 0;
            var blue = 0;
            
            allImages[i].loadPixels();
            
            for (var j = 0; j < allImages[i].pixels.length; j+=4) {
                red += allImages[i].pixels[j];
                green += allImages[i].pixels[j+1];
                blue += allImages[i].pixels[j+2];
            }

            r = Math.round(red/(allImages[i].pixels.length/4));
            g = Math.round(green/(allImages[i].pixels.length/4));
            b = Math.round(blue/(allImages[i].pixels.length/4));

            imgsHash[rgbToHex(r,g,b)] = allImages[i];

            // console.log(r,g,b);
            points.push(new Point(r,g,b))
        }
        console.timeEnd();
        console.log("Ave Img RGB end")

        
        console.log("add points to octree")
        console.time();
        for(var i = 0; i < points.length; i++){
            octree.newPoint(points[i])
        }
        console.timeEnd();
        console.log("add points to octree end")
        
        // console.log(octree.node.getTotalPoints(octree.node));

        mainImage.loadPixels();
        console.log("push points 2")
        console.time();
        for (var i = 0; i < w; i+=pxSize) {
            for (var j = 0; j < h; j+=pxSize) {
                var index = 4 * (i + (j * w));
                x = i;
                y = j;
                r = mainImage.pixels[index];
                g = mainImage.pixels[index + 1];
                b = mainImage.pixels[index + 2];
                
                mainImgRGB.push(new Array(new Point(r,g,b),i,j));
            }
        }

        startDraw();
        console.timeEnd();
        console.log("push points 2 end")
    }
}

async function draw(){
    if(drawStarted == true){
        $("#loading").html("<h1>Generating Image...</h1><br><h3>Drawing Mosaic Image</h3>");
        noStroke();
        // console.log(mainImgRGB.length);
        console.log("close points")
        console.time();
        for(var i = 0; i < mainImgRGB.length; i++){
            // console.log(mainImgRGB[i][0])
            let closePoint = octree.node.closestImageRGB(octree.node,mainImgRGB[i][0])
            // console.log(closePoint);
            closeImgs.push([closePoint,mainImgRGB[i][1],mainImgRGB[i][2]]);
        }
        console.timeEnd();
        console.log("close points end")
        // console.log(closeImgs);

        console.log("drawing image")
        console.time();
        for(var i = 0; i < closeImgs.length; i++){
            hexCol = rgbToHex(closeImgs[i][0].x,closeImgs[i][0].y,closeImgs[i][0].z);
            image(imgsHash[hexCol],closeImgs[i][1],closeImgs[i][2],pxSize,pxSize);
        }
        console.timeEnd();
        console.log("drawing image end")
        
        if(w*2 > window.innerWidth ){
            image(mainImage,0,closeImgs[closeImgs.length-1][2]+1,w,h);
        }else{
            image(mainImage,closeImgs[closeImgs.length-1][1]+1,0,w,h);
        }
        
        noLoop();

        $("#loading").html("").css("display","none");

        const deleteUploadsResult = await deleteUploads()
        console.log(deleteUploadsResult);
    }
}

function deleteUploads(){
    return new Promise((resolve,reject)=>{
        const UrlGet = url+"delete-images";
        $.ajax({
            url: UrlGet,
            type: 'GET',
            success:function(data){
                resolve(["Image upload deletion ",data]);
            },
            error:function(error){
                reject('Error',error);
            }
        });      
    });
}

function startSetup(){
    setupStarted = true;
    console.log("setupStarted",setupStarted);
}

function startDraw(){
    drawStarted = true;
    console.log("drawStarted",drawStarted);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}