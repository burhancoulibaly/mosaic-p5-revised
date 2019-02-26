const {Storage} = require('@google-cloud/storage'),
      projectId = 'Mosaic-P5';
      keyFilename = './mosaic-p5-database-firebase-adminsdk-0558w-790f08f15d.json';

const storage = new Storage({
  projectId:projectId,
  keyFilename:keyFilename
})

const bucket = storage.bucket('gs://mosaic-p5-database.appspot.com');

function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/'+bucket+'/'+filename;
}

function uploadToGCS(req,res,next){
    if (!req.file) {
      return next();
    }
  
    const gcsname = "main_images/"+Date.now() + req.file.originalname;
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