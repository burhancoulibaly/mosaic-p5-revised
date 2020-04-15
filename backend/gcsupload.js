const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gConfig = require("../config/config"),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

const storage = new Storage({
  projectId:firebaseConf.projectId,
  credentials:{
    // client_email:global.gConfig.client_email,
    // private_key:global.gConfig.private_key,
    client_email:process.env.client_email,
    private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
  },
});

// console.log("StorageInfo:",storage);

const bucket = storage.bucket(CLOUD_BUCKET);
// const corsConfiguration = [
//     {
//       "origin": ["http://localhost:3000", "https://mosaic-p5-demo.herokuapp.com"],
//       "responseHeader": ["Content-Type", "Authorization",  "Content-Length", "User-Agent", "x-goog-resumable"],
//       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     }
// ]; // allows request from "https://mosaic-p5-demo.herokuapp.com" and "http://localhost:3000"

// bucket.setCorsConfiguration(corsConfiguration).then(function(data) {
//     const apiResponse = data[0];
//     console.log(apiResponse.cors[0].origin);
//     console.log(apiResponse.cors[0].responseHeader);
// });

bucket.getMetadata()
.then((result) => {
    console.log(result[1].body.cors);
})

function uploadResizedImages(imageNames){
    return new Promise(async(resolve,reject) => {
        let resizedImages = new Array();

        try{
            await Promise.all(imageNames.map(async(imageName) => {
                try{
                    resizedImage = await uploadResizedImage(imageName);
                    resizedImages.push(resizedImage);
                }catch(err){
                    reject(err);
                }
            }));

        }catch(err){
            reject(err);
        }

        resolve(resizedImages);
    });
}

function uploadResizedImage(imageName){
    return new Promise((resolve,reject) => {
        const readStream  = bucket.file(imageName).createReadStream();
        const remoteWriteStream = bucket.file("resized_images/"+imageName).createWriteStream(); 

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
        const stockImagesFolder = "stock_images";
        const delimeter = "/";

        const signedUrlOptions = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 3 * 60 * 1000 // 3 minutes
        };

        const optionsStockImages = {
            prefix: stockImagesFolder,
            delimeter: delimeter
        }

        try{
            const [stockImages] = await bucket.getFiles(optionsStockImages);
            const mainImage = stockImages[Math.floor(Math.random()*stockImages.length)];
            const [signedMainImageUrl] = await bucket.file(mainImage.name).getSignedUrl(signedUrlOptions);
            let stockImageNames = new Array();

            await Promise.all(stockImages.map(async(stockImage) => {
                if(stockImage.name !== "stock_images/"){
                    try{
                        const stockImageName = stockImage.name;
                        stockImageNames.push(stockImageName);
                    }catch(error){
                        console.log(error);
                        reject(error);
                    }
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
        const resizedImagesFolder = "resized_images";
        const delimeter = "/";

        const signedUrlOptions = {
            version: 'v4',
            action: 'read',
            expires: Date.now() + 3 * 60 * 1000 // 3 minutes
        };

        const optionsResizedImages = {
            prefix: resizedImagesFolder,
            delimeter: delimeter
        }

        try{
            const [resizedImages] = await bucket.getFiles(optionsResizedImages);
            let signedUrls = new Array();
            
            await Promise.all(resizedImages.map(async(resizedImage) => {
                try{
                    const [signedUrl] = await bucket.file(resizedImage.name).getSignedUrl(signedUrlOptions);
                    console.log(signedUrl);
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
        const resizedImagesFolder = "resized_images";
        const delimeter = "/";

        const optionsResizedImages = {
            prefix:resizedImagesFolder,
            delimeter:delimeter
        }

        bucket.getFiles(optionsResizedImages)
        .then(async(results)=>{
            console.log(results);
            const [imgsToDelete] = results;

            if(imgsToDelete.length == 0){
                resolve("Empty Bucket");
            }

            Promise.all(imgsToDelete.map(async(img)=>{
                return bucket.file(img.metadata.name).delete();
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
    uploadResizedImages,
    bucket,
    getStockImages,
    getResizedImages,
    deleteImages
};