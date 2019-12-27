const path = require('path'),
      gConfig = require("../config/config"),
      multer = require('multer'),
      firebaseConf = global.gConfig.development.firebaseConfig,
      GCSSharp = require("./gcs-sharpe");



class Storage{
    constructor(folderId){
        let _folderId = folderId;

        let gcsSharp = new GCSSharp(_folderId);

        let _storageBig = gcsSharp.getStorageBig;
        let _storageSmall = gcsSharp.getStorageSmall;

        let _uploadBig =  multer({ storage:  _storageBig });
        let _uploadSmall = multer({ storage: _storageSmall });

        // console.log(_storageBig);
        // console.log(_storageSmall);

        return {
            get getFolderId(){
                return _folderId;
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