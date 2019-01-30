// boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
// octree = new Quad(boundary,9);
// point = new Point(155,126,143)
// octree.newPoint(point);
// console.log(octree.node.getTotalPoints(octree.node))
let imgArray;
let allImages = new Array();
let points = new Array()

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
    boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
    octree = new Quad(boundary,9);

    img = loadImage("./images/stock_images/"+"file3251255366828.jpg");
    for (var i = 0; i < imgArray.length; i++) {
    allImages[i] = loadImage("./images/stock_images/"+imgArray[i]);
    }
}

function setup(){
    w = img.width;
    h = img.height;

    pxSize = (Math.round(w/h))*10;
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

        // console.log(r,g,b);
        points.push(new Point(r,g,b))
    }

    for(var i = 0; i < points.length; i++){
        octree.newPoint(points[i])
    }
    
    console.log(octree.node.getTotalPoints(octree.node));


}