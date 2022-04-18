const { initializeApp, cert } = require('firebase-admin/app');
const { firebaseConfig, serviceAccount } = require("../../config/config.js");

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL
})

module.exports = {
    app
}