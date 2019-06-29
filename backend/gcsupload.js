const {Storage} = require('@google-cloud/storage'),
<<<<<<< HEAD
      path = require('path'),
      gcsSharp = require('multer-sharp'),
      gConfig = require("../config/config"),
      firebaseConf = global.gConfig.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket,
      multer = require('multer');

const storage = new Storage({
  projectId:firebaseConf.projectId,
  keyFilename:"./config/config.json"
});

const bucket = storage.bucket(CLOUD_BUCKET);
=======
      path = require('path');

      projectId = 'Mosaic-P5';
      keyFilename = './keyfile.json';

const storage = new Storage({
  projectId:projectId,
  keyFilename:keyFilename
});

const bucket = storage.bucket('gs://mosaic-p5-database.appspot.com');
>>>>>>> 87c15838d9781e3c3cf955ee16972abd8f05cb72

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucket.name+'/'+filename;
}

<<<<<<< HEAD
function uploadToGCSMain(req,res,next){
=======
function uploadToGCS(req,res,next){
>>>>>>> 87c15838d9781e3c3cf955ee16972abd8f05cb72
    if (!req.file) {
      return next();
    }
  
<<<<<<< HEAD
    const gcsName = "main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);

    req.file.cloudStoragePublicUrl = getPublicUrl(gcsName);
    next();
  }

  function uploadToGCSSmall(req,res,next){
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

  const storageSmall = gcsSharp({
    filename: (req, file, cb) => {
      console.log(file.fieldname, file.originalname);
      cb(null,"resized_images/"+file.fieldname + '-' + Date.now() + 
      path.extname(file.originalname));
    },
    bucket:CLOUD_BUCKET,
    projectId:storage.projectId,
    keyFilename:"./config/config.json",
    acl: 'publicRead',
    size:{
      width:100,
      height:100
    },
    max:true
  });
  
  const storageBig = gcsSharp({
    filename: (req, file, cb) => {
      cb(null,"main_image/"+file.fieldname + '-' + Date.now() + 
      path.extname(file.originalname));
    },
    bucket:CLOUD_BUCKET,
    projectId:storage.projectId,
    keyFilename:"./config/config.json",
    acl: 'publicRead',
    max:true
  });
  
  const uploadBig = multer({
    storage:storageBig
  });
  
  const uploadSmall = multer({
    storage:storageSmall
  });

  async function getImages(){
    return new Promise(async(resolve,reject)=>{
      const mainFolder = "main_image";
      const resizeFolder = "resized_images";
      let resolveArr = new Array();
  
      const delimeter = "/";
  
      const optionsMain = {
        prefix:mainFolder,
        delimeter:delimeter
      }
  
      const optionsResize = {
        prefix:resizeFolder,
        delimeter:delimeter
      }

      bucket.getFiles(optionsMain)
      .then((results)=>{
        const [imageMain] = results;
        resolveArr.push(imageMain);

        return bucket.getFiles(optionsResize);
      })
      .then((results)=>{
        const [imagesResized] = results;
        resolveArr.push(imagesResized);

        resolve(resolveArr);
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
            reject(err);
          })      
      })
      .catch((err)=>{
        reject(err);
      })
    });
  };

  module.exports = {
    uploadToGCSMain,
    uploadToGCSSmall,
    uploadBig,
    uploadSmall,
    getImages,
    deleteImages
=======
    const gcsname = "main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
    const file = bucket.file(gcsname);
  
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      },
      resumable: false
    });
  
    stream.on('error', (err) => {
      req.file.cloudStorageError = err;
      next(err);
    });
  
    stream.on('finish', () => {
      req.file.cloudStorageObject = gcsname;
      file.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
      });
    });
  
    stream.end(req.file.buffer);  
  }

  module.exports = {
    uploadToGCS
>>>>>>> 87c15838d9781e3c3cf955ee16972abd8f05cb72
  };