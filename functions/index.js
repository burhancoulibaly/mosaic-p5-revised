const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.newSession = functions.https.onRequest((request, response) => {
	let text = "";
	let possible = "ABCDEFGHIJKMNPQRSTUVWXYZ123456789";
	let db = admin.firestore();
	
	for(let i = 0; i < 8; i++){
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	response.send(db);

	// db.collection('session').doc(text).set({})
	// 	.then(()=>{
	// 		response.send(text);
	// 	})
	// 	.catch((err)=>{
	// 		response.send(err);
	// 	})
});
