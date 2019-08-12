const Session = require('./session');

class SessionManager extends Session{
    constructor(){
        super();
    }
    
    // getImages(){
    //     this.imagesRetrieval()
    //     .then((resolveData)=>{
    //       // console.log("images",resolveData);
    //       console.log("success",resolveData)
    //       return resolveData;
    //     })
    //     .catch((rejectData)=>{
    //       console.log("error", rejectData)
    //       return rejectData;
    //     })
    // }

    // getImages(){
    //     return new Promise((resolve,reject)=>{
    //         const root = super.getSessionId;
    //         const mainFolder =  root+"/main_image";
    //         const resizeFolder =  root+"/resized_images";
    //         let resolveArr = new Array();
        
    //         const delimeter = "/";
        
    //         const optionsMain = {
    //             prefix: mainFolder,
    //             delimeter: delimeter
    //         }
        
    //         const optionsResize = {
    //             prefix: resizeFolder,
    //             delimeter: delimeter
    //         }

    //         super.getBucket.getFiles(optionsMain)
    //         .then((results)=>{
    //             const [imageMain] = results;
    //             console.log(imageMain);
    //             resolveArr.push(imageMain);

    //             return super.getBucket.getFiles(optionsResize);
    //         })
    //         .then((results)=>{
    //             const [imagesResized] = results;
    //             console.log([imagesResized]);
    //             resolveArr.push(imagesResized);

    //             resolve(resolveArr);
    //         })
    //         .catch((err)=>{
    //             reject(err);
    //         })
    //     })
    // }

    deleteSessionData(){
        this.deleteSession()
        .then((resolveData)=>{
          return this.deleteImages();
        })
        .then((resolveData)=>{
          return resolveData;
        })
        .catch((rejectData)=>{
          return rejectData;
        })
    }
    
    deleteImages(){
        this.imageDeletion()
        .then((resolveData)=>{
          console.log(resolveData);
          return resolveData;
        })
        .catch((rejectData)=>{
          console.log(rejectData);
          return rejectData;
        })
    }

    imageDeletion(){
        return new Promise(async(resolve,reject)=>{
            super.getBucket.getFiles()
            .then(async(results)=>{
            // console.log(results);
            const [imgsToDelete] = results;
            console.log([imgsToDelete]);

            if(imgsToDelete.length == 0){
                resolve("Empty Bucket");
            }
        
            Promise.all(imgsToDelete.map(async(img)=>{
                return super.getBucket.file(img.metadata.name).delete();
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

    deleteSession(){
        console.log();
        return new Promise((resolve,reject)=>{
            request.post({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url: 'https://us-central1-mosaic-p5-database.cloudfunctions.net/deleteSession', 
            form:{sessionId: super.getSessionId},
            json: true,
            }, (err, res, body) => {
            if (err) { return reject(err); }
            resolve(res.body);
            })
        });
    }
}

module.exports = SessionManager;