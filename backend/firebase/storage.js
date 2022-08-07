const { getStorage, storageRef, deleteObject } = require('firebase-admin/storage');
const sharp = require('sharp');
const crypto = require('crypto');

function getFilename(req, file, cb) {
    crypto.randomBytes(16, function (err, raw) {
        cb(err, err ? undefined : raw.toString('hex'))
    })
}

function FirebaseStorage (opts) {
    if(!opts){
        throw new Error("Required options are missing")
    }
    
    this.opts = opts ? opts : {};

    this.getFilename = this.opts.filename ? this.opts.filename : this.getFilename;

    if(!this.opts.subDir){
        throw new Error("Sub-directory is required")
    }

    if(!this.opts.bucketId){
        throw new Error("Project bucket is required");
    }
    
    if(!this.opts.projectId){
        throw new Error("Project Id is required");
    }

    const bucket = this.opts.app 
                    ? getStorage(this.opts.app).bucket(this.opts.bucketId)
                    : getStorage().bucket(this.opts.bucketId);

    this.removeFiles = (async function(req, res, next){
        try {
            if(this.opts.subDir === "main") {
                const mainMetaData = req.body.mainMetaData;

                if(mainMetaData){
                    await bucket.file(mainMetaData.filename).delete();
                }
            }else if (this.opts.subDir === "images") {
                const imagesMetaData = req.body.imagesMetaData;
                
                await Promise.all(imagesMetaData.map(async (metaData) => {
                    if(metaData){
                        try {
                            await bucket.file(metaData.filename).delete();
                            return;
                        } catch (error) {
                            console.log({
                                name: error.name,
                                message: error.message
                            })
                        }         
                    }    
                }));
            }

            next();
        } catch (error) {
            console.log({
                name: error.name,
                message: error.message
            });
            
            next();
        }
    }).bind(this)

    FirebaseStorage.prototype._handleFile = function(req, file, cb) {
        (function handleFile(req, file, cb){
            this.getFilename(req, file, (err, filename) => {
                if(err) {
                    return cb(err);
                }
                
                var gcsFile = bucket.file(filename);

                const streamOpts = {
                    predefinedAcl: this.opts.acl || 'private'
                };
                
                file.stream
                    .pipe(
                        sharp()
                        .resize({ 
                            width: this.opts.resize ? parseInt(this.opts.resize.width) : null, 
                            height: this.opts.resize ? parseInt(this.opts.resize.height) : null,
                            fit: this.opts.resize ? this.opts.resize.fit : null
                        })
                    )
                    .pipe(gcsFile.createWriteStream(streamOpts))
                    .on('error', (err) => cb(err))
                    .on('finish', (file) => cb(null, {
                        path: `https://${this.opts.bucketId}.storage.googleapis.com/${filename}`,
                        filename: filename
                    }));
            });
        }).call(this, req, file, cb);
    }
    
    FirebaseStorage.prototype._removeFile = function(req, file, cb) {
        const gcsFile = bucket.file(file.filename);
        gcsFile.delete();
    }
};

module.exports = function firebaseStorage(opts){
    return new FirebaseStorage(opts);
};