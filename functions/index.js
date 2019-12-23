const functions = require('firebase-functions'),
      FieldValue = require('firebase-admin').firestore.FieldValue;
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
let db = admin.firestore();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.newSession = functions.https.onRequest((request, response) => {
	db.collection('Session IDs').doc(request.body.sessionId).set({id:request.body.sessionId})
		.then((data)=>{
			response.send(["New Session: ",data,request.body.sessionId]);
			return "New Session: ",data;
		})
		.catch((err)=>{
			response.send("Error creating session",err);
		})
});

exports.deleteSession = functions.https.onRequest((request, response) =>{
	sessionRef = db.collection('Session IDs').doc(request.body.sessionId)
	
	deleteField()
		.then(()=>{
			return deleteDocument();
		})
		.then((resolveData)=>{
			response.send(resolveData);
			return "Session Deleted";
		})
		.catch((rejectData)=>{
			response.send(rejectData);
		})


	function deleteField(){
		return new Promise(async(resolve,reject)=>{
			await sessionRef.update({id: FieldValue.delete()});
			resolve("Field Deleted");
		})
	}
	
	function deleteDocument(){
		return new Promise(async(resolve,reject)=>{
			try {
				await sessionRef.delete()
				resolve("Session Deleted");
			} catch (error) {
				reject(error);
			}
		})
	}
});
