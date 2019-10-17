let imgArray;
let mainImage;
let allImages = new Array();
let points = new Array();
let mainImgRGB = new Array();
let closeImgs = new Array();
let imgsHash = new Object;
let setupStarted = false;
let drawStarted = false;
let preloadStarted = false;
let octree = null;
let mainHas = false;
let smallHas = false;
let socket = io();
// let uri = "http://localhost:3000/";
let uri = "https://mosiac-p5.herokuapp.com/";

socket.on('New Session', function(sessionId){
    setCookie(sessionId);
    console.log(document.cookie);
})

// $(window).on("unload", function(e) {
//     deleteSessions()
//     .then((resolveData)=>{
//         console.log(resolveData);
//     })
//     .catch((rejectData)=>{
//         console.log(rejectData);
//     });
// });

$('#main').change(function() { 
    // console.log("changed");
    if((document.getElementById("main").files).length == 0){
        mainHas = false;
        
        $("#mainImgLabel img").remove();
        $("#mainImgLabel").append('<div id="mainImgText">Click To Insert Main Image</div>');
        
        $("#sendImgs").removeClass("create");
        $("#sendImgs").addClass("create-hidden");
    }else{
        mainImage = URL.createObjectURL(document.getElementById("main").files[0]);
        // console.log(mainImage);

        $("#mainImgText").remove()

        $("#mainImgLabel").prepend('<img class="prevMain" src="" />');
        $("#mainImgLabel img").attr("src",mainImage);
    
        mainHas = true;

        if(mainHas == true && smallHas == true){
            $("#sendImgs").removeClass("create-hidden");
            $("#sendImgs").addClass("create");
        }       
    }
}); 

$('#small').change(function() { 
    // console.log("changed");
    blobImages = new Array();
    smallImages = document.getElementById("small").files;
    
    if((document.getElementById("small").files).length < 4){
        smallHas = false;

        $("#smallImgsLabel img").remove();
        $("#smallImgsText").remove();
        $("#smallImgsLabel").append('<div id="smallImgsText">Click to Insert Images to Create Mosaic (min. 4 images)</div>');
        
        $("#sendImgs").removeClass("create");
        $("#sendImgs").addClass("create-hidden");

    }else{
        for(var i = 0; i < smallImages.length; i++){
            smallImage = URL.createObjectURL(smallImages[i]);
            blobImages.push(smallImage);
        }
        // console.log(blobImages); 
    
        $("#smallImgsText").remove();
    
        for(var i = 0; i < blobImages.length; i++){
            $("#smallImgsLabel").append('<img class="prevSmall" src='+blobImages[i]+' />');
        }

        smallHas = true;

        if(mainHas == true && smallHas == true){
            $("#sendImgs").removeClass("create-hidden");
            $("#sendImgs").addClass("create");
        }
    }
}); 

function mainClr(){
    mainHas = false;

    $("#sendImgs").removeClass("create");
    $("#sendImgs").addClass("create-hidden");
    
    $("#mainImg").get(0).reset();
    $("#mainImgLabel img").remove();
    $("#mainImgLabel").append('<div id="mainImgText">Click To Insert Main Image</div>');

}

function smallClr(){
    smallHas = false;

    $("#sendImgs").removeClass("create");
    $("#sendImgs").addClass("create-hidden");

    $("#smallImg").get(0).reset();
    $("#smallImgsLabel img").remove();
    $("#smallImgsText").remove();
    $("#smallImgsLabel").append('<div id="smallImgsText">Click to Insert Images to Create Mosaic (min. 4 images)</div>');

}

function submitImages(){
    $(".upload-page").hide();

    mainImage = document.getElementById("main").files[0];
    smallImages = document.getElementById("small").files;
    formDataBig = new FormData();
    formDataSmall = new FormData();

    formDataBig.append("image",mainImage);
    for(var i = 0; i < smallImages.length; i++){
        formDataSmall.append("images",smallImages[i]);
    }

    let postMainImage =  function(){
        //uploading main image
        console.log("uploading main image");
        return new Promise((resolve,reject)=>{
        const UrlPostBig = "mainimage";
            $.ajax({
                url: uri+UrlPostBig,
                type: 'POST',
                data: formDataBig,
                processData: false,
                contentType: false,
                success:function(data){
                    resolve(["Main image posted",data]);
                },
                error:function(error){
                    reject('Error',error);
                }
            });
        });
    }

    let resizeSmallImages = function(){
        //resizing and uploading small images
        console.log("resizing and uploading small images");
        return new Promise((resolve,reject)=>{
            const UrlPost = "resizeimages";
            $.ajax({
                url: uri+UrlPost,
                type: 'POST',
                data: formDataSmall,
                processData: false,
                contentType: false,
                success:function(data){
                    resolve(["Small images resized",data]);
                },
                error:function(error){
                    reject('Error',error);
                }
            });       
        });
    }

    let getAllImages = function(){
        //getting all images
        console.log("getting all images");
        return new Promise((resolve,reject)=>{
            const UrlGet = "getimages";
            $.ajax({
                url: uri+UrlGet,
                type: 'GET',
                success:function(data){
                    console.log(data)
                    resolve(["All images recieved",data]);
                },
                error:function(error){
                    reject('Error',error);
                }
            });
        });
    }

    console.time();

    console.log("Uploading and resizing images");

    postMainImage()
    .then((resolveData)=>{
        console.log(resolveData[0]);
        // console.log(resolveData[1]);

        return resizeSmallImages();
    })
    .then((resolveData)=>{
        console.log(resolveData[0]);

        // for(var i = 0;i < resolveData[1].length;i++){
        //     console.log(resolveData[1][i]);
        // }

        return getAllImages();
    })
    .then((resolveData)=>{
        console.log(resolveData);
        imgArray = resolveData[1];

        console.timeEnd();

        startPreload();
        preload();
    })
    .catch((rejectData)=>{
        console.log(rejectData);
    });
}

function preload(){
    if(preloadStarted == true){
        mainImage = imgArray[0][0].metadata.mediaLink;
        img = loadImage(mainImage);
        for (var i = 0; i < imgArray[1].length; i++) {
            resizedImage = imgArray[1][i].metadata.mediaLink
            allImages[i] = loadImage(resizedImage);
        }
        setTimeout(()=>{
            startSetup();
            setup();
        },2000);
    }
}

function setup(){
    if(setupStarted == true){
        let boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
        octree = new Quad(boundary,Math.ceil(allImages.length/100));

        w = img.width;
        h = img.height;

        pxSize = (Math.round(w/h))*10;
        canvas = createCanvas(w*2,h*2);
        canvas.position(0,0);

        for (var i = 0; i < allImages.length; i++) {
            colArray = null;
            var red = 0;
            var green = 0;
            var blue = 0;
            // console.log(allImages[i]);
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
            // console.log(points[i]);
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
        startDraw();
    }
}

function draw(){
    if(drawStarted == true){
        console.log(mainImgRGB.length);
        for(var i = 0; i < mainImgRGB.length; i++){
            // console.log(mainImgRGB[i][0])
            let closePoint = octree.node.closestImageRGB(octree.node,mainImgRGB[i][0])
            // console.log(closePoint);
            closeImgs.push([closePoint,mainImgRGB[i][1],mainImgRGB[i][2]]);
        }
        
        // console.log(closeImgs);

        for(var i = 0; i < closeImgs.length; i++){
            hexCol = rgbToHex(closeImgs[i][0].x,closeImgs[i][0].y,closeImgs[i][0].z);
            image(imgsHash[hexCol],closeImgs[i][1],closeImgs[i][2],pxSize,pxSize);
        }
        
        if(w*2 > window.innerWidth ){
            image(img,0,closeImgs[closeImgs.length-1][2]+1,w,h);
        }else{
            image(img,closeImgs[closeImgs.length-1][1]+1,0,w,h);
        }

        noLoop();

        // deleteUploads()
        // .then((resolveData)=>{
        //     console.log(resolveData[0]+resolveData[1]);
        // })
        // .catch((rejectData)=>{
        //     console.log(rejectData);
        // })
    }
}

// function deleteUploads(){
//     return new Promise((resolve,reject)=>{
//         const UrlGet = "deleteimages";
//         $.ajax({
//             url: uri+UrlGet,
//             type: 'GET',
//             success:function(data){
//                 resolve(["Image upload deletion ",data]);
//             },
//             error:function(error){
//                 reject('Error',error);
//             }
//         });      
//     });
// }

// function deleteSessions(){
//     return new Promise((resolve,reject)=>{
//         const UrlGet = "delete-session";
//         $.ajax({
//             // async: false,
//             url: uri+UrlGet,
//             type: 'GET',
//             // data: JSON.stringify({sessionId: getSessionId()}),
//             // contentType: "application/json; charset=utf-8",
//             processData: false,
//             success:function(data){
//                 resolve(["session deletion",data]);
//             },
//             error:function(error){
//                 reject('Error',error);
//             }
//         });      
//     });
// }

function getSessionId(){
    let cookie = document.cookie;
    sessionId = cookie.split("=");
    sessionId = sessionId[2];
    console.log(sessionId);
    return sessionId;
}

function startPreload(){
    preloadStarted = true;
    console.log("preloadStarted",preloadStarted)
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

function createSession(){
    return new Promise((resolve,reject)=>{
    const UrlGet = "newsession";
        $.ajax({
            url: uri+UrlGet,
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

function setCookie(sessionId){
    document.cookie = "sessionId ="+sessionId+";";
}