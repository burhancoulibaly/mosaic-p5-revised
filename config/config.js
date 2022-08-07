const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : '';

if(envFile){
    dotenv.config({ path: envFile });
}

const firebaseConfig = {
    apiKey: process.env.APIKEY,
    authDomain: process.env.AUTHDOMAIN,
    databaseURL: process.env.DATABASEURL,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID,
    appId: process.env.APPID
}

const serviceAccount = JSON.parse(process.env.SERVICEACCOUNT)

module.exports = {
    firebaseConfig,
    serviceAccount
}