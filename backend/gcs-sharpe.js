const path = require('path'),
      {Storage} = require('@google-cloud/storage'),
      gConfig = require("../config/config"),
      gcsSharp = require('../custom_module/multer-sharp'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class GCSSharp{
    constructor(){
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
                cb(null,file.fieldname + '-' + Date.now() + 
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
                cb(null,file.fieldname + '-' + Date.now() + 
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

        return{
            get getStorage(){
                return _storage
            },
            get getStorageBig(){
                return _storageBig
            },
            get getStorageSmall(){
                return _storageSmall
            }
        }
    }
}
module.exports = GCSSharp;