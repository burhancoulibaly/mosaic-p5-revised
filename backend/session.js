const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gcsSharp = require('../custom_module/multer-sharp'),
      gConfig = require("../config/config"),
      multer = require('multer');
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class Session{
  constructor(){
    var that = this;
    let _createSession = function(){
      return new Promise((resolve,reject)=>{
        request('https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', { json: true }, (err, res, body) => {
          if (err) { return reject(err); }
          console.log(res.body);
          resolve(res.body[2]);
        })
      })
    };

    let _storage = new Storage({
          projectId:firebaseConf.projectId,
          credentials:{
            client_email:global.gConfig.client_email,
            private_key:global.gConfig.private_key
            // client_email:process.env.client_email,
            // private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
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
            client_email:global.gConfig.client_email,
            private_key:global.gConfig.private_key
            // client_email:process.env.client_email,
            // private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
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
            client_email:global.gConfig.client_email,
            private_key:global.gConfig.private_key
            // client_email:process.env.client_email,
            // private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
          },
          acl: 'publicRead',
          size:{
            width:100,
            height:100
          },
          max:true
        });
    
    let _sessionId = _createSession();
    let _bucket = _storage.bucket(CLOUD_BUCKET);
    let _uploadBig = multer({ storage: _storageBig });
    let _uploadSmall = multer({ storage: _storageSmall });

    return {
      getUploadBig(){
        console.log(this)
        return _uploadBig;
      },

      getUploadSmall(){
        return _uploadSmall;
      },

      getSessionId(){
        return _sessionId;
      },

      getBucket(){
        return _bucket;
      },

      
      getPublicUrl(filename){
        return 'https://storage.googleapis.com/'+this.getBucket().name+'/'+filename;
      },
      
      uploadToGCSMain(req,res,next){
        if (!req.file) {
          return next();
        }

        let id = () => {
          this.getSessionId();
        }

        const gcsName = id+"/main_image/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
        
        function getpublicUrl(){
          return this.getPublicUrl(gcsName)
        }

        let publicUrl = getpublicUrl.bind(Session);
  
        req.file.cloudStoragePublicUrl = publicUrl;
        next();
      },
      
      uploadToGCSSmall(req,res,next){
        if (!req.files) {
          return next();
        }
    
        let imgUrls = new Array();

        function getSessionId(){
          return this.getSessionId();
        }

        let id = getSessionId.bind(Session);

        for(var i = 0;i < req.files.length;i++){
          const gcsName = id+"/resized_images/"+req.files[i].fieldname + '-' + Date.now() + path.extname(req.files[i].originalname);
          
          function getpublicUrl(){
            return this.getPublicUrl(gcsName)
          }
  
          let publicUrl = getpublicUrl.bind(Session);

          imgUrls[i] = publicUrl;
        }
    
        req.files.cloudStoragePublicUrl = imgUrls;
        next();
      },
    
      async getImages(){
        return new Promise(async(resolve,reject)=>{
          const root = this.getSessionId();
          const mainFolder = "main_image";
          const resizeFolder = "resized_images";
          let resolveArr = new Array();
      
          const delimeter = "/";
      
          const optionsMain = {
            prefix: root+"/"+mainFolder,
            delimeter:delimeter
          }
      
          const optionsResize = {
            prefix: root+"/"+resizeFolder,
            delimeter:delimeter
          }
    
          this.getBucket().getFiles(optionsMain)
          .then((results)=>{
            const [imageMain] = results;
            resolveArr.push(imageMain);
    
            return this.getBucket().getFiles(optionsResize);
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
      },
      
      async deleteImages(){
        return new Promise(async(resolve,reject)=>{
          this.getBucket().getFiles()
          .then(async(results)=>{
            // console.log(results);
            const [imgsToDelete] = results;
            console.log([imgsToDelete]);
    
            if(imgsToDelete.length == 0){
              resolve("Empty Bucket");
            }
      
          Promise.all(imgsToDelete.map(async(img)=>{
            return this.getBucket().file(img.metadata.name).delete();
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
      },
      
      deleteSession(){
        console.log();
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
            form:{sessionId: this.getSessionId()},
            json: true,
          }, (err, res, body) => {
            if (err) { return reject(err); }
            resolve(res.body);
          })
        });
      },
    }
  }
}
module.exports = Session;




