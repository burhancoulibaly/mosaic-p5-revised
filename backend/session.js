const ygConfig = require("../config/config"),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class Session{
  constructor(storage){
    let _storage = storage;
    
    let _bucket = _storage.bucket(CLOUD_BUCKET);

    let _getImage = (image_name)=>{
      return new Promise(async (resolve,reject)=>{
        try{
          let imageData = _bucket.file(image_name.image).getMetadata()
          resolve(imageData);
        }catch(err){
          reject(err);
        }
      })
    }
    
    let _deleteImage = (image)=>{
      return new Promise(async (resolve,reject)=>{
        try{
          let imageData = _bucket.file(image[0].name).delete();
          resolve(imageData);
        }catch(err){
          reject(err);
        }
      })
    }
    
    return {
      get getBucket(){
        return _bucket;
      },
      getPublicUrl(filename){
        return 'https://storage.googleapis.com/'+this.getBucket.name+'/'+filename;
      },
      getImages(image_names){
        return new Promise(async(resolve,reject)=>{
          console.log(image_names);
          if(image_names[0] && image_names[1]){
            try{
              let mainImage = await _getImage(image_names[0])
              let images = await Promise.all(image_names[1].map(async (image_name) => { return _getImage(image_name) }));

              console.log(mainImage,images);

              resolve([mainImage, images]);
            }catch(err){
              console.log(err);
              reject(err)
            }
          }
          resolve([])
        })
      },
      createSession(sessionId){
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {
              'content-type' : 'application/x-www-form-urlencoded'
            },
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', 
            form: {
              sessionId: sessionId
            }, 
            json: true,
          }, (err, res, body) => {
            if (err) { 
              reject(err); 
            }
            resolve(res.body);
          })
        });
      },
      storeImages(sessionId, main_image_url, images_url){
        console.log(sessionId, main_image_url, images_url)
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {
              'content-type' : 'application/x-www-form-urlencoded'
            },
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/storeImages',
            form: {
              sessionId: sessionId,
              main_image_url: main_image_url,
              image_urls: images_url
            }, 
            json: true,
          }, (err, res, body) => {
            if (err) { 
              reject(err); 
            }
            resolve(res.body);
          })
        });
      },
      getImageURLS(sessionId){
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {
              'content-type' : 'application/x-www-form-urlencoded'
            },
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/getImageURLS', 
            form: {
              sessionId: sessionId
            }, 
            json: true,
          }, (err, res, body) => {
            if (err) { 
              console.log(err)
              reject(err); 
            }
            resolve(res.body);
          })
        });
      },
      deleteImageLinks(sessionId){
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {
              'content-type' : 'application/x-www-form-urlencoded'
            },
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteImages', 
            json: true,
            form: {
              sessionId: sessionId
            }, 
          }, (err, res, body) => {
            if (err) { 
              reject(err); 
            }
            resolve(["Deleting Session: "+sessionId,res.body]);
          })
        });
      },
      deleteSession(sessionId){
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {
              'content-type' : 'application/x-www-form-urlencoded'
            },
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
            json: true,
            form: {
              sessionId: sessionId
            }, 
          }, (err, res, body) => {
            if (err) { 
              reject(err); 
            }
            resolve(["Deleting Session: "+sessionId,res.body]);
          })
        });
      },
      imageDeletion(image_names){
        return new Promise(async(resolve,reject)=>{
          if(image_names[0] && image_names[1]){
            try{
              let mainImage = await _getImage(image_names[0])
              let images = await Promise.all(image_names[1].map(async (image_name) => { return _getImage(image_name) }));

              images.concat(mainImage);

              let deleteInfo = await Promise.all(images.map(async (image) => { return _deleteImage(image) }));

              resolve(deleteInfo);
            }catch(err){
              console.log(err);
              reject(err)
            }
          }

          resolve([])  
        });
      }
    }
  }
}
module.exports = Session;