const {Storage} = require('@google-cloud/storage'),
      gConfig = require("../config/config"),
      multer = require('multer'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket,
      StorageGCS = require("./storage");

let text = "";
let possible = "ABCDEFGHIJKMNPQRSTUVWXYZ123456789";

class Session{
  constructor(){
    for(let i = 0; i < 8; i++){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    let _storage = new Storage({
      projectId:firebaseConf.projectId,
      credentials:{
        client_email:global.gConfig.client_email,
        private_key:global.gConfig.private_key
        // client_email:process.env.client_email,
        // private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
      },
    });
    
    let _sessionId = text;
    let _bucket = _storage.bucket(CLOUD_BUCKET);
    let _storageGCS = new StorageGCS(_sessionId);
    let _uploadBig =  multer({ storage: _storageGCS.getStorageBig });
    let _uploadSmall = multer({ storage: _storageGCS.getStorageSmall });
    let _publicUrl = null;
    
    
    return {
      get getSessionId(){
        return _sessionId;
      },
      get getBucket(){
        return _bucket;
      },
      get getUploadBig(){
        return _uploadBig;
      },
      get getUploadSmall(){
        return _uploadSmall;
      },
      getPublicUrl(filename){
        _publicUrl = 'https://storage.googleapis.com/'+this.getBucket.name+'/'+filename;
        return _publicUrl;
      },
      createSession(){
        console.log("Creating Session: "+this.getSessionId);
        return new Promise((resolve,reject)=>{
          request.post({
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', 
          form:{sessionId: this.getSessionId},
          json: true,
          }, (err, res, body) => {
          if (err) { return reject(err); }
          resolve(res.body);
          })
        });
      },
      deleteSession(){
        console.log("Deleting Session "+this.getSessionId);
        return new Promise((resolve,reject)=>{
          request.post({
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
          form:{sessionId: this.getSessionId},
          json: true,
          }, (err, res, body) => {
          if (err) { return reject(err); }
          resolve(res.body);
          })
        });
      },
      getImages(){
        return new Promise(async(resolve,reject)=>{
          const root = this.getSessionId;
          const mainFolder =  root+"/main_image";
          const resizeFolder =  root+"/resized_images";
          let resolveArr = new Array();
      
          const delimeter = "/";
      
          const optionsMain = {
            prefix: mainFolder,
            delimeter: delimeter
          }
      
          const optionsResize = {
            prefix: resizeFolder,
            delimeter: delimeter
          }

          this.getBucket.getFiles(optionsMain)
          .then(async (results)=>{
            const [imageMain] = results;
            // console.log(imageMain);
            await resolveArr.push(imageMain);

            return await this.getBucket.getFiles(optionsResize);
          })
          .then(async (results)=>{
            const [imagesResized] = results;
            // console.log([imagesResized]);
            await resolveArr.push(imagesResized);
            resolve(resolveArr);
          })
          .catch((err)=>{
            reject(err);
          })
        })
      },
      imageDeletion(){
        return new Promise(async(resolve,reject)=>{
          this.getBucket.getFiles()
          .then(async(results)=>{
          // console.log(results);
          const [imgsToDelete] = results;
          console.log([imgsToDelete]);

          if(imgsToDelete.length == 0){
              resolve("Empty Bucket");
          }
      
          Promise.all(imgsToDelete.map(async(img)=>{
              return this.getBucket.file(img.metadata.name).delete();
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
      }
    }
  }
}

module.exports = Session;