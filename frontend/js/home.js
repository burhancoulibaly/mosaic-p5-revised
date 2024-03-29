import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
const { getStorage, ref, getBlob } = require('firebase/storage');
import p5 from "p5";
import {Octree, Rectangle, Point, Quad} from "./octree.js";
import '../css/home.css';
import "../../node_modules/bootstrap/dist/css/bootstrap.css";

let authInfo;
let p5Container;
let imageFiles;
let mainMetaData;
let imagesMetaData;
let mainDataURL;
let imageDataURLs;
let mainImage;
let allImages = new Array();
let points = new Array();
let mainImgRGB = new Array();
let closeImgs = new Array();
let imgsHash = new Object;
let octree = null;
let mainHas = false;
let imagesHas = false;
let imagesDeleted = false;

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    databaseURL: process.env.DATABASEURL,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID,
    appId: process.env.APPID
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const bucket = getStorage(app);

const uri = process.env.NODE_ENV == "development"
            ? "http://localhost:4000"
            : "https://uploads.mixop.app";

function onloadCallback(){
    grecaptcha.render("sendImgs", {
        sitekey: process.env.RECAPTCHA,
        callback: validateReCAPTCHA
    });
}

window.onload = async function(e){
    document.getElementById("main").addEventListener('change', mainImgChanged);
    document.getElementById("mainClr").addEventListener('click', mainClr);
    document.getElementById("images").addEventListener('change', imagesChanged);
    document.getElementById("imgsClr").addEventListener('click', imagesClr);

    try {
        authInfo = await signInAnonymously(auth)

        console.log({
            status: `Success`,
            message: `User authenticated, id: ${authInfo.user.uid}`
        });
    } catch (error) {
        console.log({
            status: error.code,
            message: error.message + " (May need to refresh)"
        });
    }

    p5Container = document.createElement("div");
    p5Container.setAttribute("id", "p5container");

    onloadCallback();
};

window.onbeforeunload = async function(e){
    if(!imagesDeleted){
        await deleteImages();
    }
    
    await auth.signOut();
    console.log("signedOut")

    document.getElementById("main").removeEventListener('change', mainImgChanged);
    document.getElementById("mainClr").removeEventListener('click', mainClr);
    document.getElementById("images").removeEventListener('change', imagesChanged);
    document.getElementById("imgsClr").removeEventListener('click', imagesClr);
    // document.getElementById("sendImgs").removeEventListener('click', submitImages);
};

function mainImgChanged() {
    let image = (document.getElementById("main").files).length ? document.getElementById("main").files[0] : null;

    if(image && image.size > 31457280){
        image = null;
        alert("Image size too large");
    }
    
    if(!image){
        mainHas = false;
        const imgLabelRef = document.getElementById("mainImgLabel");

        if(imgLabelRef.getElementsByTagName("img").item(0)){
            imgLabelRef.removeChild(imgLabelRef.getElementsByTagName("img").item(0));

            if(!document.getElementById("mainImgText")){
                const mainImgText = document.createElement("div");
                mainImgText.setAttribute("id", "mainImgText");
                mainImgText.innerHTML = "Click To Insert Main Image"
                imgLabelRef.append(mainImgText);
            }

            const sendImgs = document.getElementById("sendImgs")
            sendImgs.classList.remove("create");
            sendImgs.classList.add("create-hidden");
        }
    }else{
        const mainImageBlob = URL.createObjectURL(document.getElementById("main").files[0]);

        if(document.getElementById("mainImgText")){
            document.getElementById("mainImgText").remove();
        }else{
            document.getElementsByClassName("prevMain")[0].remove();
        }
        
        const imgLabelRef = document.getElementById("mainImgLabel");

        const imgEl = document.createElement("img");
        imgEl.classList.add("prevMain");
        imgEl.setAttribute("src", mainImageBlob);
        imgLabelRef.prepend(imgEl);
    
        mainHas = true;

        if(mainHas == true && imagesHas == true){
            const sendImgs = document.getElementById("sendImgs");

            sendImgs.classList.remove("create-hidden");
            sendImgs.classList.add("create");
        }       
    }
}; 

function mainClr(){
    mainHas = false;
    
    const sendImgs = document.getElementById("sendImgs");
    const imgLabelRef = document.getElementById("mainImgLabel");
    
    sendImgs.classList.remove("create");
    sendImgs.classList.add("create-hidden");
    
    document.getElementById("mainImg").reset();
    
    imgLabelRef.removeChild(imgLabelRef.getElementsByTagName("img").item(0));

    if(!document.getElementById("mainImgText")){
        const mainImgText = document.createElement("div");
        mainImgText.setAttribute("id", "mainImgText");
        mainImgText.innerHTML = "Click To Insert Main Image"
        imgLabelRef.append(mainImgText);
    }
}

function imagesChanged(){ 
    const blobImages = new Array();
    let imgViolations = 0;
    const newLine = "\r\n";
    let msg = "The following images exceed our image size limits (30MB):";

    imageFiles = new Array();

    for(let i = 0; i < (document.getElementById("images").files).length; i++){
        const image = document.getElementById("images").files[i];
        
        if(image.size > 31457280){
            msg += newLine;
            msg += " - " + image.name;
            imgViolations++;
        }else{
            imageFiles.push(image);
        }
    }

    if(imgViolations > 0){
        alert(msg);
    }

    if(imageFiles.length < 1){
        imagesHas = false;

        const imgLabelsRef = document.getElementById("imgLabels");

        Object.entries(imgLabelsRef.getElementsByTagName("img")).map(([_, img]) => {
            imgLabelsRef.removeChild(img);
        })
        
        if(!document.getElementById("imgsText")){
            const imgsText = document.createElement("div");
            imgsText.setAttribute("id", "imgsText");
            imgsText.innerHTML = "Click to Insert Images to Create Mosaic"
            imgLabelsRef.append(imgsText);
        }

        const sendImgs = document.getElementById("sendImgs")
        sendImgs.classList.remove("create");
        sendImgs.classList.add("create-hidden");

        document.getElementById("imgs").reset();
    }else if(imageFiles.length > 100){
        imagesHas = false;

        const imgLabelsRef = document.getElementById("imgLabels");

        Object.entries(imgLabelsRef.getElementsByTagName("img")).map(([_, img]) => {
            imgLabelsRef.removeChild(img);
        })
        
        if(!document.getElementById("imgsText")){
            const imgsText = document.createElement("div");
            imgsText.setAttribute("id", "imgsText");
            imgsText.innerHTML = "Click to Insert Images to Create Mosaic"
            imgLabelsRef.append(imgsText);
        }

        const sendImgs = document.getElementById("sendImgs")
        sendImgs.classList.remove("create");
        sendImgs.classList.add("create-hidden");

        document.getElementById("imgs").reset();

        alert("Maximum of 100 images allowed")
    }else{
        const imgLabelsRef = document.getElementById("imgLabels");

        for(let i = 0; i < imageFiles.length; i++){
            blobImages.push(URL.createObjectURL(imageFiles[i]));
        }

        if(document.getElementById("imgsText")){
            document.getElementById("imgsText").remove();
        }else{
            Object.entries(imgLabelsRef.getElementsByClassName("prevImgs")).map(([_, img]) => {
                imgLabelsRef.removeChild(img);
            })
        }
    
        for(let i = 0; i < blobImages.length; i++){
            const imgEl = document.createElement("img");
            imgEl.classList.add("prevImgs");
            imgEl.setAttribute("src", blobImages[i]);
            imgLabelsRef.append(imgEl);
        }

        imagesHas = true;

        if(mainHas == true && imagesHas == true){
            const sendImgs = document.getElementById("sendImgs");

            sendImgs.classList.remove("create-hidden");
            sendImgs.classList.add("create");
        }
    }
}; 

function imagesClr(){
    imagesHas = false;
    
    const sendImgs = document.getElementById("sendImgs");
    const imgLabelsRef = document.getElementById("imgLabels");
    
    sendImgs.classList.remove("create");
    sendImgs.classList.add("create-hidden");
    
    document.getElementById("imgs").reset();

    Object.entries(imgLabelsRef.getElementsByTagName("img")).map(([_, img]) => {
        imgLabelsRef.removeChild(img);
    })

    if(!document.getElementById("imgsText")){
        const imgsText = document.createElement("div");
        imgsText.setAttribute("id", "imgsText");
        imgsText.innerHTML = "Click to Insert Images to Create Mosaic (min. 4 images)"
        imgLabelsRef.append(imgsText);
    }
}

async function validateReCAPTCHA(token){
    try {
        const { response } = await validate(token);
        
        if(response.message.success){
            submitImages();
        }
    } catch (error) {
        console.log(error);
    }
}

async function submitImages(){
    document.getElementById("upload-page").hidden = true;
    document.getElementById("loading").hidden = false;
    const body = document.getElementsByTagName("body").item(0);
    body.append(p5Container);

    const formDataMain = new FormData();
    const main = document.getElementById("main").files[0];
    
    let formDataImages = new FormData();
    const images = imageFiles;

    formDataMain.append("image", main);

    console.log("Submitting images");
    const responseMain = await postMain(formDataMain);

    let payloadSize = 0;
    let responseImages = new Array();

    for(let i = 0; i < Object.entries(images).length; i++){
        if(payloadSize + Object.entries(images)[i][1].size >  134217728){
            try {
                const { response } = await postImages(formDataImages);
                responseImages.push(...response);
                formDataImages = new FormData();
                payloadSize = 0;
            } catch (error) {
                console.log(error);
            }
        }

        formDataImages.append("images", Object.entries(images)[i][1]);
        payloadSize += Object.entries(images)[i][1].size;

        if(i == Object.entries(images).length-1){
            const { response } = await postImages(formDataImages);
            responseImages.push(...response);
            formDataImages = new FormData();
            payloadSize = 0;
        }
    }

    console.log("Submission complete")
    mainMetaData = responseMain.response;
    mainDataURL = await getDataURL([mainMetaData]);

    imagesMetaData = responseImages;
    imageDataURLs = await getDataURL(imagesMetaData);
    
    try {
        console.log("Generating image")
        new p5(sketch, p5Container);
    } catch (error) {
        console.log(error)
    }
}

function validate(token){
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = (event) => {
            resolve({
                status: xhr.status, 
                response: xhr.response
            });
        }

        xhr.onerror = (event) => {
            reject({
                status: xhr.status, 
                response: xhr.response
            })
        }

        xhr.open("POST", "/validateCaptcha");
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.responseType = "json";
        xhr.send(JSON.stringify({token}));
    })
}

function postMain(formDataMain){
    //uploading main image
    return new Promise((resolve,reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = (event) => {
            resolve({
                status: xhr.status, 
                response: xhr.response
            });
        }

        xhr.onerror = (event) => {
            reject({
                status: xhr.status, 
                response: xhr.response
            })
        }

        xhr.open("POST", uri + "/uploadmain");
        xhr.setRequestHeader("Authorization", authInfo.user.accessToken);
        xhr.withCredentials = true;
        xhr.responseType = "json";
        xhr.send(formDataMain);
    });
}

function postImages(formDataImages){
    //uploading images
    console.log("uploading")
    return new Promise((resolve,reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = (data) => {
            resolve({
                status: xhr.status, 
                response: xhr.response
            });
        }

        xhr.onerror = (error) => {
            reject({
                status: xhr.status, 
                response: xhr.response
            })
        }

        xhr.open("POST", uri + "/uploadimages");
        xhr.setRequestHeader("Authorization", authInfo.user.accessToken);
        xhr.withCredentials = true;
        xhr.responseType = "json";
        xhr.send(formDataImages);
    });
}

const sketch = (p5) => {
    p5.preload = function() {
        try {
            mainImage = p5.loadImage(mainDataURL);
        } catch (error) {
            console.log(error);
        }
        

        allImages = Array.from(imageDataURLs.map((imageDataURL) => {
            try {
                return p5.loadImage(imageDataURL);
            } catch (error) {
                console.log(error);
            }
        }));
    }

    p5.setup = function() {
        let boundary = new Rectangle(127.5,127.5,127.5,127.5,127.5);
        octree = new Quad(boundary,Math.ceil(allImages.length/50));

        if(mainImage.width > 5000 || mainImage.height > 5000){
            if(mainImage.width > mainImage.height){
                mainImage.resize(5000, 0);
            } else {
                mainImage.resize(0, 5000);
            }
        }

        const w = mainImage.width;
        const h = mainImage.height;

        const pxSize = (Math.round(w/h))*10;

        const canvas = p5.createCanvas(w*2,h*2);

        canvas.position(0,0);

        for(let i = 0; i < allImages.length; i++) {
            try {
                let colArray = null;
                let red = 0;
                let green = 0;
                let blue = 0;
    
                allImages[i].loadPixels();
            
                for(let j = 0; j < allImages[i].pixels.length; j+=4) {
                    red += allImages[i].pixels[j];
                    green += allImages[i].pixels[j+1];
                    blue += allImages[i].pixels[j+2];
                }
    
                const r = Math.round(red/(allImages[i].pixels.length/4));
                const g = Math.round(green/(allImages[i].pixels.length/4));
                const b = Math.round(blue/(allImages[i].pixels.length/4));
    
                imgsHash[rgbToHex(r,g,b)] = allImages[i];
    
                points.push(new Point(r,g,b)) 
            } catch (error) {
                console.log(error)
            }
        }

        
        for(let i = 0; i < points.length; i++){
            octree.newPoint(points[i])
        }

        try {
            mainImage.loadPixels();
        } catch (error) {
            console.log(error)
        }

        for (let i = 0; i < w; i+=pxSize) {
            for (let j = 0; j < h; j+=pxSize) {
                let index = 4 * (i + (j * w));
                let x = i;
                let y = j;
                let r = mainImage.pixels[index];
                let g = mainImage.pixels[index + 1];
                let b = mainImage.pixels[index + 2];
                
            
                mainImgRGB.push(new Array(new Point(r,g,b),i,j));
            }
        }
    }

    p5.draw = function(){
        const w = mainImage.width;
        const h = mainImage.height;
        const pxSize = (Math.round(w/h))*10;

        for(let i = 0; i < mainImgRGB.length; i++){
            let closePoint = octree.node.closestImageRGB(octree.node,mainImgRGB[i][0]);
            closeImgs.push([closePoint,mainImgRGB[i][1],mainImgRGB[i][2]]);
        }

        for(let i = 0; i < closeImgs.length; i++){
            const hexCol = rgbToHex(closeImgs[i][0].x,closeImgs[i][0].y,closeImgs[i][0].z);

            p5.image(imgsHash[hexCol],closeImgs[i][1],closeImgs[i][2],pxSize,pxSize); 
        }
        
        if(w*2 > window.innerWidth ){
            p5.image(mainImage,0,closeImgs[closeImgs.length-1][2]+pxSize,w,h);
        }else{
            p5.image(mainImage,closeImgs[closeImgs.length-1][1]+pxSize,0,w,h);
        }

        p5.noLoop();
        
        document.getElementById("loading").hidden = true;

        (async () => {
            console.log(await deleteImages());
            imagesDeleted = true;
        }).call(this);
    }
};

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

async function getDataURL(imageMetaData){
    if(!imageMetaData){
        return new Error("Image info required");
    }
    
    const dataurls = await Promise.all(
        imageMetaData.map(async (metadata) => {
            return new Promise(async (resolve, reject) => {
                const imageRef = ref(bucket, metadata.filename);
            
                try {
                    const reader = new FileReader();
                    const blob = await getBlob(imageRef);

                    reader.onload = function() {
                        return resolve(reader.result);
                    }

                    reader.onerror = function() {
                        console.log(reader.result);
                        return reject(null);
                    }

                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.log(error);
                    return reject(null);
                }
            })
        })
    );

    const filteredDataUrls = dataurls.filter((dataurl) => dataurl !== null);

    return filteredDataUrls;
}

function deleteImages(){
    return new Promise((resolve,reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = (event) => {
            resolve({
                status: xhr.status, 
                response: xhr.response
            });
        }

        xhr.onerror = (event) => {
            reject({
                status: xhr.status, 
                response: xhr.response
            })
        }

        xhr.open("POST", uri + "/deleteimages");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", authInfo.user.accessToken);
        xhr.withCredentials = true;
        xhr.responseType = "json";
        xhr.send(JSON.stringify({ mainMetaData, imagesMetaData }));
    });
}