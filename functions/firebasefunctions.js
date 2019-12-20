// // The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
// const functions = require('firebase-functions');

// // The Firebase Admin SDK to access the Firebase Realtime Database.
// const admin = require('firebase-admin');
// admin.initializeApp();

// exports.newSession = functions.https.onRequest((request, response) => {
// 	let text = "";
// 	let possible = "ABCDEFGHIJKMNPQRSTUVWXYZ123456789";
// 	admin.initializeApp(functions.config().firebase);
// 	let db = admin.firestore();
	
// 	for(let i = 0; i < 8; i++){
// 		text += possible.charAt(Math.floor(Math.random() * possible.length));
// 	}

// 	response.send(db);

	// db.collection('session').doc(text).set({})
	// 	.then(()=>{
	// 		response.send(text);
	// 	})
	// 	.catch((err)=>{
	// 		response.send(err);
	// 	})
// });