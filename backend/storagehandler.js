const { firebaseConfig } = require("../config/config.js");
const firebaseStorage = require("./firebase/storage")
const firebaseApp = require("./firebase/initialize");
const crypto = require('crypto');
const path = require("path");

function StorageHandler(){
    this._storageMain = firebaseStorage({
        filename: (req, file, cb) => {
            cb(
                null,
                `${req.payload.uid}/main/${file.fieldname}-${crypto.randomBytes(16).toString('hex')}-${file.originalname.replaceAll(" ", "-")}`
            );
        },
        app: firebaseApp.app,
        subDir: "main",
        acl: "private", 
        bucketId: firebaseConfig.storageBucket,
        projectId:firebaseConfig.projectId
    });

    this._storageImages = firebaseStorage({
        filename: (req, file, cb) => {
            cb(
                null,
                `${req.payload.uid}/images/${file.fieldname}-${crypto.randomBytes(16).toString('hex')}-${file.originalname.replaceAll(" ", "-")}`
            );
        },
        app: firebaseApp.app,
        subDir: "images",
        acl: "private", 
        resize: {
            width: 100,
            height: 100,
            fit: "inside"
        },
        bucketId: firebaseConfig.storageBucket,
        projectId:firebaseConfig.projectId
    });
}

StorageHandler.prototype.getStorageMain = function(){
    return this._storageMain;
}

StorageHandler.prototype.getStorageImages = function(){
    return this._storageImages;
}

module.exports = new StorageHandler();

