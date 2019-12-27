const {Storage} = require('@google-cloud/storage'),
      gConfig = require("../config/config"),
      firebaseConf = global.gConfig.development.firebaseConfig,
      CLOUD_BUCKET = firebaseConf.storageBucket;

class Session{
  constructor(sessionId){
    let _storage = new Storage({
      projectId:firebaseConf.projectId,
      credentials:{
        client_email:global.gConfig.client_email,
        private_key:global.gConfig.private_key
        // client_email:process.env.client_email,
        // private_key:new Buffer.from(process.env.private_key_base64, 'base64').toString("ascii").replace(/\\n/g, '\n')
      },
    });
    
    let _sessionId = sessionId;
    let _bucket = _storage.bucket(CLOUD_BUCKET);
    
    
    return {
      get getSessionId(){
        return _sessionId;
      },
      get getBucket(){
        return _bucket;
      },
      getPublicUrl(filename){
        return 'https://storage.googleapis.com/'+this.getBucket.name+'/'+filename;;
      },
      createSession(){
        return new Promise((resolve,reject)=>{
          request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/newSession', 
            form:{sessionId: this.getSessionId},
            json: true,
          }, (err, res, body) => {
          if (err) { 
            reject(err); 
          }
            resolve(res.body);
          })
        });
      },
      deleteSession(){
        return new Promise((resolve,reject)=>{
          request.post({
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
          form:{sessionId: this.getSessionId},
          json: true,
          }, (err, res, body) => {
          if (err) { 
            reject(err); 
          }
          resolve(["Deleting Session: "+this.getSessionId,res.body]);
          })
        });
      },
      getImages(folderId){
        return new Promise(async(resolve,reject)=>{
          const root = folderId;
          const mainFolder =  root+"/main_image";
          const resizeFolder =  root+"/resized_images";
          let resolveArr = new Array();
      
          const delimeter = "/";
      
          const optionsMain = {
            prefix: mainFolder,
            delimeter: delimeter
          }
      
          const optionsResize = {
            prefix: resizeFolder,
            delimeter: delimeter
          }

          this.getBucket.getFiles(optionsMain)
          .then(async (results)=>{
            const [imageMain] = results;
            // console.log(imageMain);
            await resolveArr.push(imageMain);

            return await this.getBucket.getFiles(optionsResize);
          })
          .then(async (results)=>{
            const [imagesResized] = results;
            // console.log([imagesResized]);
            await resolveArr.push(imagesResized);
            resolve(resolveArr);
          })
          .catch((err)=>{
            reject(err);
          })
        })
      },
      imageDeletion(folderId){
        return new Promise(async(resolve,reject)=>{
          const root = folderId;
          const images =  root;

          const delimeter = "/";

          const sessionImages = {
            prefix: images,
            delimeter: delimeter
          }

          this.getBucket.getFiles(sessionImages)
          .then(async(results)=>{
          // console.log(results);
          const [imgsToDelete] = results;
          // console.log([imgsToDelete].length);

          if(imgsToDelete.length == 0){
              resolve("Empty Bucket");
          }
      
          Promise.all(imgsToDelete.map(async(img)=>{
              return this.getBucket.file(img.metadata.name).delete();
          }))
          .then((resolveData)=>{
              resolve(resolveData);
          })
          .catch((err)=>{
              console.log(err);
              reject(err);
          })      
          })
          .catch((err)=>{
          console.log(err);
          reject(err);
          })
        });
      }
    }
  }
}

module.exports = Session;