// boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
// octree = new Quad(boundary,9);
// point = new Point(155,126,143)
// octree.newPoint(point);
// console.log(octree.node.getTotalPoints(octree.node))
let boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
let octree = new Quad(boundary,9);
let imgArray;
let allImages = new Array();
let points = new Array();
let mainImgRGB = new Array();
let closeImgs = new Array();
let imgsHash = new Object;

window.onload = function(){
    $.ajax({
        type: 'GET',
        async:false,
        url:"http://localhost:3000/getimages",
        success:function(data){
        imgArray = data;
        // console.log('success',data);
        }
    });
}

function preload() {
    img = loadImage("./images/stock_images/"+"DSCN1756 2.JPG");
    for (var i = 0; i < imgArray.length; i++) {
    allImages[i] = loadImage("./images/stock_images/"+imgArray[i]);
    }
}

function setup(){
    w = img.width;
    h = img.height;

    pxSize = (Math.round(w/h))*5;
    canvas = createCanvas(w,h);
    canvas.position(0,0);

    for (var i = 0; i < allImages.length; i++) {
        colArray = null;
        var red = 0;
        var green = 0;
        var blue = 0;
        allImages[i].resize(250,250);
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

    
    for(var i = 0; i < points.length; i++){
        octree.newPoint(points[i])
    }
    
    console.log(octree.node.getTotalPoints(octree.node));

    img.loadPixels();
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
}

function draw(){
    console.log(mainImgRGB.length);
    for(var i = 0; i < mainImgRGB.length; i++){
        // console.log(mainImgRGB[i][0])
        let closePoint = octree.node.closestImageRGB(octree.node,mainImgRGB[i][0])
        // console.log(closePoint);
        closeImgs.push([closePoint,mainImgRGB[i][1],mainImgRGB[i][2]]);
    }
    
    console.log(closeImgs);

    for(var i = 0; i < closeImgs.length; i++){
        hexCol = rgbToHex(closeImgs[i][0].x,closeImgs[i][0].y,closeImgs[i][0].z);
        image(imgsHash[hexCol],closeImgs[i][1],closeImgs[i][2],pxSize,pxSize);
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