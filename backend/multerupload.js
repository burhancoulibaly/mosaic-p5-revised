const multer = require('multer');
const storageHandler = require("./storagehandler.js");

function MulterUpload(){
    const storageMain = storageHandler.getStorageMain();
    const storageImages = storageHandler.getStorageImages();

    this._uploadMain =  multer({ storage:  storageMain });
    this._uploadImages = multer({ storage: storageImages });
}

MulterUpload.prototype.uploadMain = function(){
    return this._uploadMain;
}

MulterUpload.prototype.uploadImages = function(){
    return this._uploadImages
}

module.exports = new MulterUpload();