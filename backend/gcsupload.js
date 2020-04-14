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

console.log("StorageInfo:",storage);

const bucket = storage.bucket(CLOUD_BUCKET);

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucket.name+'/'+filename;
}

function uploadResizedImages(req,res,next){
    // console.log(req.files);
    // console.log(req.file);
    
    if (!req.files) {
        return next();
    }

    imgUrls = new Array();

    for(var i = 0;i < req.files.length;i++){
        const gcsName = "resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);
        imgUrls[i] = getPublicUrl(gcsName)
    }

    req.files.cloudStoragePublicUrl = imgUrls;
    next();
}

function uploadResizedImage(imageName){
    return new Promise((resolve,reject) => {
        const readStream  = fs.createReadStream(images+"/images/"+imageName);
        const remoteWriteStream = bucket.file("resized_images/"+imageName).createWriteStream(); 

        // on error of output file being saved
        remoteWriteStream.on('error', function(err) {
            reject("Error:",err);
        });
        
        // on success of output file being saved
        remoteWriteStream.on('finish', function() {
            resolve("Success");
        });

        transform = sharp().resize({width:100,height:100});

        readStream.pipe(transform).pipe(remoteWriteStream);
    });
}

async function getResizedImages(){
    return new Promise((resolve,reject)=>{
        const resizedImagesFolder = "resized_images";

        const delimeter = "/";

        const optionsResize = {
            prefix:resizedImagesFolder,
            delimeter:delimeter
        }

        bucket.getFiles(optionsResize)
        .then((results)=>{
            const [resizedImageLinks] = results;

            resolve(resizedImageLinks);
        })
        .catch((err)=>{
            reject(err);
        })
    })
}

async function deleteImages(){
    return new Promise(async(resolve,reject)=>{
        bucket.getFiles()
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
    uploadResizedImage,
    bucket,
    getResizedImages,
    deleteImages
  };