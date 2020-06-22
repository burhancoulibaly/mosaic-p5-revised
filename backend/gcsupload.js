const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gConfig = require("../config/config"),
      admin = require("firebase-admin"),
      serviceAccount = global.gConfig;
      
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "mosaic-p5-database.appspot.com"
});

const stockImagesBucket = admin.storage().bucket("mosaic-p5-stock-images");
const resizedImagesBucket = admin.storage().bucket("mosaic-p5-resized-images");

// const corsConfiguration = [
//     {
//       "origin": ["http://localhost:3000", "https://mosaic-p5-demo.herokuapp.com"],
//       "responseHeader": ["Content-Type", "Authorization",  "Content-Length", "User-Agent", "x-goog-resumable"],
//       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     }
// ]; // allows request from "https://mosaic-p5-demo.herokuapp.com" and "http://localhost:3000"

// stockImagesBucket.setCorsConfiguration(corsConfiguration).then(function(data) {
//     const apiResponse = data[0];
//     console.log(apiResponse.cors[0].origin);
//     console.log(apiResponse.cors[0].responseHeader);
// });

// resizedImagesBucket.setCorsConfiguration(corsConfiguration).then(function(data) {
//     const apiResponse = data[0];
//     console.log(apiResponse.cors[0].origin);
//     console.log(apiResponse.cors[0].responseHeader);
// });

stockImagesBucket.getMetadata()
.then((result) => {
    console.log(result[1].body.cors);
})

resizedImagesBucket.getMetadata()
.then((result) => {
    console.log(result[1].body.cors);
})

function uploadResizedImage(imageName){
    return new Promise((resolve,reject) => {
        const readStream  = stockImagesBucket.file(imageName).createReadStream();
        const remoteWriteStream = resizedImagesBucket.file(imageName).createWriteStream(); 

        // on error of output file being saved
        readStream.on('error', function(err) {
            reject("Error:",err);
        });
        
        // on success of output file being saved
        remoteWriteStream.on('finish', function() {
            resolve("Success");
        });

        transform = sharp().resize({width:100,height:100});

        readStream.pipe(transform).pipe(remoteWriteStream);
    })
}

async function getStockImages(){
    return new Promise(async(resolve,reject)=>{
        const signedUrlOptions = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 3 * 60 * 1000 // 3 minutes
        };

        try{
            const [stockImages] = await stockImagesBucket.getFiles();
            const mainImage = stockImages[Math.floor(Math.random()*stockImages.length)];
            const [signedMainImageUrl] = await mainImage.getSignedUrl(signedUrlOptions);
            let stockImageNames = new Array();

            await Promise.all(stockImages.map(async(stockImage) => {
                try{
                    const stockImageName = stockImage.name;
                    stockImageNames.push(stockImageName);
                }catch(error){
                    console.log(error);
                    reject(error);
                }
            }));

            resolve([signedMainImageUrl, stockImageNames]);
        }catch(err){
            console.log(err);
            reject(err);
        }
    }) 
}

async function getResizedImages(){
    return new Promise(async(resolve,reject)=>{
        const signedUrlOptions = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 3 * 60 * 1000 // 3 minutes
        };

        try{
            const [resizedImages] = await resizedImagesBucket.getFiles();
            let signedUrls = new Array();
            
            await Promise.all(resizedImages.map(async(resizedImage) => {
                try{
                    const [signedUrl] = await resizedImage.getSignedUrl(signedUrlOptions);
                    // console.log(signedUrl);
                    signedUrls.push(signedUrl);
                }catch(error){
                    console.log(error);
                    reject(error);
                }
            }));

            resolve(signedUrls);
        }catch(err){
            console.log(err);
            reject(err);
        }
    })
}

async function deleteImages(){
    return new Promise(async(resolve,reject)=>{
        resizedImagesBucket.getFiles()
        .then(async(results)=>{
            console.log(results);
            const [imgsToDelete] = results;

            if(imgsToDelete.length == 0){
                resolve("Empty Bucket");
            }

            Promise.all(imgsToDelete.map(async(img)=>{
                return img.delete();
            }))
            .then((resolveData)=>{
                resolve(resolveData);
            })
            .catch((err)=>{
                console.log(err);
                reject(err);
            })      
        })
        .catch((err)=>{
            console.log(err);
            reject(err);
        })
    });
};

module.exports = {
    uploadResizedImage,
    getStockImages,
    getResizedImages,
    deleteImages
};