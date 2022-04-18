const { getAuth } = require('firebase-admin/auth');
const { app } = require('./initialize.js');

const auth = getAuth(app);

async function verifyUser(req,res,next){
    const authorization = req.headers["authorization"];
    try {
        const authInfo = await auth.verifyIdToken(authorization);

        req.payload = {
            ...req.payload,
            isAuthenticated: true,
            uid: authInfo.uid
        }

        next();
    } catch (error) {
        console.log({
            status: error.code,
            message: error.message
        });

        res.status(401).send({ status: "Error", message: "User unauthorized"});
    }
}

module.exports = {
    verifyUser
}