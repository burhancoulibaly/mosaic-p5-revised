const path = require('path'),
      gConfig = require("../config/config"),
      gcsSharp = require('../custom_module/multer-sharp'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;


class Storage{
    constructor(sessionId){
        console.log("Folder: "+sessionId);
        let _storageBig = null;
        let _storageSmall = null;

        _storageBig = gcsSharp({
            filename: (req, file, cb) => {
              cb(null,sessionId+"/main_image/"+file.fieldname + '-' + Date.now() + 
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
  
        _storageSmall = gcsSharp({
            filename: (req, file, cb) => {
            // console.log(file.fieldname, file.originalname);
            cb(null,sessionId+"/resized_images/"+file.fieldname + '-' + Date.now() + 
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

        // console.log(_storageBig);
        // console.log(_storageSmall);

        return {
            get getStorageBig(){
                return _storageBig;
            },
            get getStorageSmall(){
                return _storageSmall;
            },
        }
    }
}
module.exports = Storage;