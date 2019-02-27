const path = require('path');

const {Storage} = require('@google-cloud/storage'),
      projectId = 'Mosaic-P5';
      keyFilename = './mosaic-p5-database-firebase-adminsdk-0558w-e260b73db6.json';

const storage = new Storage({
  projectId:projectId,
  keyFilename:keyFilename
})

const bucket = storage.bucket('gs://mosaic-p5-database.appspot.com');

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucket.name+'/'+filename;
}

function uploadToGCS(req,res,next){
    if (!req.file) {
      return next();
    }
  
    const gcsname = "main_images/"+req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname);
    const file = bucket.file(gcsname);
  
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      },
      resumable: false
    });
  
    stream.on('error', (err) => {
      req.file.cloudStorageError = err;
      next(err);
    });
  
    stream.on('finish', () => {
      req.file.cloudStorageObject = gcsname;
      file.makePublic().then(() => {
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
      });
    });
  
    stream.end(req.file.buffer);  
  }

  module.exports = {
    uploadToGCS
  };