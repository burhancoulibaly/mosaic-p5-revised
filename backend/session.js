const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gcsSharp = require('../custom_module/multer-sharp'),
      gConfig = require("../config/config"),
      multer = require('multer'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class Session{
  constructor(){
    let _storage = new Storage({
          projectId:firebaseConf.projectId,
          credentials:{
            // client_email:global.gConfig.client_email,
            // private_key:global.gConfig.private_key
            client_email:process.env.client_email,
            private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
          },
        });
    
    let _storageBig = gcsSharp({
          filename: (req, file, cb) => {
            cb(null,_sessionId+"/main_image/"+file.fieldname + '-' + Date.now() + 
            path.extname(file.originalname));
          },
          bucket:CLOUD_BUCKET,
          projectId:firebaseConf.projectId,
          credentials:{
            // client_email:global.gConfig.client_email,
            // private_key:global.gConfig.private_key
            client_email:process.env.client_email,
            private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
          },
          acl: 'publicRead',
          max:true
        });

    let _storageSmall = gcsSharp({
          filename: (req, file, cb) => {
            // console.log(file.fieldname, file.originalname);
            cb(null,_sessionId+"/resized_images/"+file.fieldname + '-' + Date.now() + 
            path.extname(file.originalname));
          },
          bucket:CLOUD_BUCKET,
          projectId:firebaseConf.projectId,
          credentials:{
            // client_email:global.gConfig.client_email,
            // private_key:global.gConfig.private_key
            client_email:process.env.client_email,
            private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
          },
          acl: 'publicRead',
          size:{
            width:100,
            height:100
          },
          max:true
        });

    
    let _sessionId = null;
    let _bucket = _storage.bucket(CLOUD_BUCKET);
    let _uploadBig = multer({ storage: _storageBig });
    let _uploadSmall = multer({ storage: _storageSmall });
    let _publicUrl = null;
    
    return {
      get getUploadBig(){
        return _uploadBig;
      },
      get getUploadSmall(){
        return _uploadSmall;
      },
      get getSessionId(){
        return _sessionId;
      },
      get getBucket(){
        return _bucket;
      },
      resetUploads(){
        _storageBig = null;
        _storageSmall = null;
        _uploadBig = null;
        _uploadSmall = null;
      },
      getPublicUrl(filename){
        _publicUrl = 'https://storage.googleapis.com/'+this.getBucket.name+'/'+filename;
        return _publicUrl;
      },
      createSession(){
        // if(_sessionId != null){
        //   return new Promise((resolve,reject)=>{
        //     resolve(this.getSessionId);
        //   })
        // }else{
          return new Promise((resolve,reject)=>{
            request('https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', { json: true }, (err, res, body) => {
              if (err) {
                 reject(err); 
              }
              _sessionId = res.body[2];
              resolve(res.body[2]);
            })
          })
        // }
      },
      getImages(){
        return new Promise(async(resolve,reject)=>{
          const root = this.getSessionId;
          console.log(this.getSessionId)
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