// boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
// octree = new Quad(boundary,9);
// point = new Point(155,126,143)
// octree.newPoint(point);
// console.log(octree.node.getTotalPoints(octree.node))
let boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
let imgArray;
let mainImage;
let allImages = new Array();
let points = new Array();
let mainImgRGB = new Array();
let closeImgs = new Array();
let imgsHash = new Object;
let octree = null;

console.log("get images");
console.time();
window.onload = function(){
    const UrlGet = "https://mosiac-p5.herokuapp.com/getimages";
    $.ajax({
        url: UrlGet,
        type: 'GET',
        async:false, 
        success:function(data){
        imgArray = data;
            // console.log('success',data);
        },
        error:function(error){
            // console.log('Error %{error}')
        }
    });
    
    const UrlPost = "https://mosiac-p5.herokuapp.com/resizeimages";
    for(i = 0; i < imgArray.length; i++){
        $.ajax({
            url: UrlPost,
            type: 'POST',
            async:false, 
            data:JSON.stringify([imgArray[i]]),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success:function(data){
                // console.log('success',data);
            },
            error:function(error){
                // console.log('Error %{error}')
            }
        });
    }
}
console.timeEnd();
console.log("get images end");

console.log("loading images");
console.time();
function preload() {
    mainImage = imgArray[Math.floor(Math.random()*imgArray.length)];
    img = loadImage("./images/stock_images/"+ mainImage);
    for (var i = 0; i < imgArray.length; i++) {
        allImages[i] = loadImage("./images/resized_images/"+imgArray[i]);
    }
    octree = new Quad(boundary,Math.ceil(allImages.length/10));
}
console.timeEnd();
console.log("Loading images end")

function setup(){
    w = img.width;
    h = img.height;

    pxSize = (Math.round(w/h)*5);
    canvas = createCanvas(w*2,h*2);
    canvas.position(0,0);
    
    // console.log("resizing imgs")
    // console.time();
    // for(var i = 1; i < allImages.length; i++){
    //     allImages[i].resize(100,100);
    // }
    // console.timeEnd();
    // console.log("resizing imgs end")

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

    img.loadPixels();
    console.log("push points 2")
    console.time();
    for (var i = 0; i < w; i+=pxSize) {
        for (var j = 0; j < h; j+=pxSize) {
            var index = 4 * (i + (j * w));
            x = i;
            y = j;
            r = img.pixels[index];
            g = img.pixels[index + 1];
            b = img.pixels[index + 2];
            
            mainImgRGB.push(new Array(new Point(r,g,b),i,j));
        }
    }
    console.timeEnd();
    console.log("push points 2 end")
}

function draw(){
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
        image(img,0,closeImgs[closeImgs.length-1][2]+1,w,h);
    }else{
        image(img,closeImgs[closeImgs.length-1][1]+1,0,w,h);
    }
    
    
    noLoop();
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}