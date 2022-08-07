const { firebaseConfig } = require("../../config/config.js");
const { getStorage, storageRef, deleteObject, listAll } = require('firebase-admin/storage');

function cleanStorage(){
    console.log("Cleaning storage")
    const bucket =  getStorage().bucket(firebaseConfig.storageBucket);

    bucket.getFiles('/')
        .then((res) => {
            const [images] = res;
            images.map((image) => {
                timeSinceCreationMs = new Date - new Date(image.metadata.timeCreated);
                timeSinceCreationHrs = Math.floor(((timeSinceCreationMs / 1000)/60)/60);
                
                if(timeSinceCreationHrs > 24){
                    try {
                        image.delete();
                    } catch (error) {
                        console.log(error);
                    }
                }
            })
        })
}

module.exports = {
    cleanStorage
}