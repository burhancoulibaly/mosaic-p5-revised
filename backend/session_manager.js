const Session = require('./session');

class SessionManager extends Session{
    constructor(sessionId){
        super(sessionId);
    }
}

module.exports = SessionManager;