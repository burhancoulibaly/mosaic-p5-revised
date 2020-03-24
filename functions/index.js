const functions = require('firebase-functions'),
      FieldValue = require('firebase-admin').firestore.FieldValue;
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
let db = admin.firestore();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.newSession = functions.https.onRequest((request, response) => { 
	db.collection('Session_IDs').doc(request.body.sessionId).set({ id: request.body.sessionId })
		.then((data)=>{
			response.send(["New Session: ",data,request.body.sessionId]);
			return "New Session: ",data;
		})
		.catch((err)=>{
			response.send("Error creating session",err);
		})
});

exports.storeImages = functions.https.onRequest((request, response) => {
	db.collection("Session_IDs/" + request.body.sessionId + "/Main_Images").doc(getImageName(request.body.main_image_url)).set({ image_url: request.body.main_image_url, image: getImageName(request.body.main_image_url) })
		.then(()=>{
			return Promise.all(request.body.image_urls.map((image_url) => 
				db.collection("Session_IDs/" + request.body.sessionId + "/Images").doc(getImageName(image_url)).set({ image_url: image_url, image: getImageName(image_url) }))
			)
		})
		.then(()=>{
			response.send("Added images to firestore");
			return "Added images to firestore";
		})
		.catch((err)=>{
			response.send("Error adding images to firestore", err);
			return "Error adding images to firestore", err;
		})

		function getImageName(image_url){
			return image_url.split("/")[4].replace("/", "");
		}
});

exports.getImageURLS = functions.https.onRequest(async (request, response)=>{
	sessionRef = db.collection("Session_IDs").doc(request.body.sessionId);

	collections = await sessionRef.listCollections();
	
	if(collections.length === 2){
		try{
			mainImage = await sessionRef.collection("Main_Images").get()
			images = await sessionRef.collection("Images").get()
			
			mainImageData = await mainImage.docs.map((image)=>{ return image.data() });
			imagesData = await images.docs.map((image)=>{ return image.data() });

			response.send([mainImageData[0],imagesData]);
			return "Images Retrieved"
		}catch(err){
			response.send(err);
			return err;
		}
		
	}

	response.send([]);
	return "No images found";
})

exports.deleteImages = functions.https.onRequest(async (request, response) =>{
	sessionCollectionRef = db.collection('Session_IDs');
	mainImageCollectionRef = sessionCollectionRef.doc(request.body.sessionId).collection("Main_Images");
	imagesCollectionRef = sessionCollectionRef.doc(request.body.sessionId).collection("Images");

	try{
		collections = await sessionCollectionRef.doc(request.body.sessionId).listCollections();
		
		if(collections.length === 2){
			sessionDocRef = sessionCollectionRef.doc(request.body.sessionId)
			mainImage = await mainImageCollectionRef.get();
			images = await imagesCollectionRef.get();
			console.log(sessionDocRef, mainImage, images);

			sessionDocs = await sessionDocRef.get();
			mainImageDoc = mainImage.docs;
			imageDocs = images.docs;
			console.log(sessionDocs, mainImageDoc, imageDocs);

			mainImageFieldDelete = await Promise.all(mainImageDoc.map(async (doc)=>{
				await deleteField(mainImageCollectionRef, doc);
			}));
			// console.log("mainImage fields deleted: ", mainImageFieldDelete);
			imagesFieldDelete = await Promise.all(imageDocs.map(async (imageDoc)=>{
				await deleteField(imagesCollectionRef, imageDoc);
			}));
			// console.log("images fields deleted: ", imagesFieldDelete);

			mainImageDocDelete = await Promise.all(mainImageDoc.map(async (doc)=>{
				await deleteDocument(mainImageCollectionRef, doc);
			}));
			// console.log("Main_Image documents deleted: ", mainImageDocDelete);
			imageDocDelete = await Promise.all(imageDocs.map(async (imageDoc)=>{
				await deleteDocument(imagesCollectionRef, imageDoc);
			}));
			// console.log("Images documents deleted: ", imageDocDelete);

			response.send("Images in session "+ request.body.sessionId +" deleted");
			return "Images in session "+ request.body.sessionId +" deleted";
		}

		response.send("Unable to delete images in session "+ request.body.sessionId);
		return "Unable to delete images in session "+ request.body.sessionId;
	}catch(err){
		response.send(err);
		return err;
	}

	function deleteField(collectionRef, doc){
		return new Promise(async (resolve,reject)=>{
			try{
				docRef = collectionRef.doc(doc.id);
				fields = doc.data();
				fieldKeys = Object.keys(fields);

				deleteInfo = await Promise.all(fieldKeys.map(async(fieldKey)=>{
					return docRef.update({ [fieldKey]: FieldValue.delete() });
				}))

				resolve(deleteInfo);
				return deleteInfo;
			}catch(err){
				reject(err);
				return err;
			}
		})
	}
	
	function deleteDocument(collectionRef, doc){
		return new Promise(async (resolve,reject)=>{
			try {
				docRef = collectionRef.doc(doc.id);
				deleteinfo = await docRef.delete();

				resolve(deleteinfo);
				return deleteinfo;
			} catch (err) {
				reject(err);
				return err;
			}
		})
	}
})

exports.deleteSession = functions.https.onRequest(async (request, response) =>{
	sessionCollectionRef = db.collection('Session_IDs');
	mainImageCollectionRef = sessionCollectionRef.doc(request.body.sessionId).collection("Main_Images");
	imagesCollectionRef = sessionCollectionRef.doc(request.body.sessionId).collection("Images");

	try{
		collections = await sessionCollectionRef.doc(request.body.sessionId).listCollections();
		
		if(collections.length === 2){
			sessionDocRef = sessionCollectionRef.doc(request.body.sessionId)
			mainImage = await mainImageCollectionRef.get();
			images = await imagesCollectionRef.get();
			console.log(sessionDocRef, mainImage, images);

			sessionDocs = await sessionDocRef.get();
			mainImageDoc = mainImage.docs;
			imageDocs = images.docs;
			console.log(sessionDocs, mainImageDoc, imageDocs);

			mainImageFieldDelete = await Promise.all(mainImageDoc.map(async (doc)=>{
				await deleteField(mainImageCollectionRef, doc);
			}));
			// console.log("mainImage fields deleted: ", mainImageFieldDelete);
			imagesFieldDelete = await Promise.all(imageDocs.map(async (imageDoc)=>{
				await deleteField(imagesCollectionRef, imageDoc);
			}));
			// console.log("images fields deleted: ", imagesFieldDelete);

			mainImageDocDelete = await Promise.all(mainImageDoc.map(async (doc)=>{
				await deleteDocument(mainImageCollectionRef, doc);
			}));
			// console.log("Main_Image documents deleted: ", mainImageDocDelete);
			imageDocDelete = await Promise.all(imageDocs.map(async (imageDoc)=>{
				await deleteDocument(imagesCollectionRef, imageDoc);
			}));
			// console.log("Images documents deleted: ", imageDocDelete);

			sessionFieldDelete = await deleteField(sessionCollectionRef, sessionDocs);
			// console.log("Session_IDs fields deleted: ", sessionFieldDelete);
			sessionDocDelete = await deleteDocument(sessionCollectionRef, sessionDocs);
			// console.log("Session_IDs documents deleted: ", sessionDocDelete);

			response.send("Images and session "+ request.body.sessionId +" deleted");
			return "Images and session "+ request.body.sessionId +" deleted";
		}

		response.send("Unable to delete images and session "+ request.body.sessionId);
		return "Unable to delete images and session "+ request.body.sessionId;
	}catch(err){
		response.send(err);
		return err;
	}

	function deleteField(collectionRef, doc){
		return new Promise(async (resolve,reject)=>{
			try{
				docRef = collectionRef.doc(doc.id);
				fields = doc.data();
				fieldKeys = Object.keys(fields);

				deleteInfo = await Promise.all(fieldKeys.map(async(fieldKey)=>{
					return docRef.update({ [fieldKey]: FieldValue.delete() });
				}))

				resolve(deleteInfo);
				return deleteInfo;
			}catch(err){
				reject(err);
				return err;
			}
		})
	}
	
	function deleteDocument(collectionRef, doc){
		return new Promise(async (resolve,reject)=>{
			try {
				docRef = collectionRef.doc(doc.id);
				deleteinfo = await docRef.delete();

				resolve(deleteinfo);
				return deleteinfo;
			} catch (err) {
				reject(err);
				return err;
			}
		})
	}
});
