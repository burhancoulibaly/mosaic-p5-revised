const path = require('path'),
      gConfig = require("../config/config"),
      multer = require('multer'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      GCSSharp = require("./gcs-sharpe");



class Storage{
    constructor(){
        let gcsSharp = new GCSSharp();

        let _storage = gcsSharp.getStorage;
        let _storageBig = gcsSharp.getStorageBig;
        let _storageSmall = gcsSharp.getStorageSmall;

        let _uploadBig =  multer({ storage:  _storageBig });
        let _uploadSmall = multer({ storage: _storageSmall });

        // console.log(_storageBig);
        // console.log(_storageSmall);

        return {
            get getStorage(){
                return _storage
            },
            get getUploadBig(){
                return _uploadBig;
            },
            get getUploadSmall(){
                return _uploadSmall;
            },
        }
    }
}
module.exports = Storage;