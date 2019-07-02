const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gcsSharp = require('multer-sharp'),
      gConfig = require("../config/config"),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket,
      multer = require('multer');
      

const storage = new Storage({
  projectId:firebaseConf.projectId,
  credentials:{
    private_key: global.gConfig.private_key.replace(/\\n/g, '\n'),
    client_email: global.gConfig.client_email,
  },
});

console.log(storage.getCredentials());

console.log(storage.getCredentials().private_key);

console.log(JSON.stringify(storage.getCredentials()).private_key);

const bucket = storage.bucket(CLOUD_BUCKET);

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucket.name+'/'+filename;
}

function uploadToGCSMain(req,res,next){
    if (!req.file) {
      return next();
    }
  
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
    credentials:{
      private_key: storage.getCredentials().private_key,
      client_email: storage.getCredentials().client_email
    },
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
    credentials:{
      private_key: storage.getCredentials().private_key,
      client_email: storage.getCredentials().client_email
    },
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
    uploadToGCSMain,
    uploadToGCSSmall,
    uploadBig,
    uploadSmall,
    getImages,
    deleteImages
  };