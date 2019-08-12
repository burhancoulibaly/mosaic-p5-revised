const {Storage} = require('@google-cloud/storage'),
      path = require('path'),
      gcsSharp = require('../custom_module/multer-sharp'),
      gConfig = require("../config/config"),
      multer = require('multer'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class Session{
  constructor(){
    let _createSession = () => {
      return new Promise((resolve,reject)=>{
        request('https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', { json: true }, (err, res, body) => {
          if (err) { reject(err); }
          resolve(res.body[2]);
        })
      })
    };

    let _setSessionId = () => {
      _createSession().then(async(sessionId)=>{_sessionId = sessionId;}).catch(async(error)=>{_sessionId = error});
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

    
    let _sessionId = _setSessionId();
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
      getPublicUrl(filename){
        _publicUrl = 'https://storage.googleapis.com/'+this.getBucket.name+'/'+filename;
        return _publicUrl;
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
      }
    }
  }
}

module.exports = Session;