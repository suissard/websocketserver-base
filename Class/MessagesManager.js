const User = require("./User.js");
const ObjectsManager = require("./ObjectsManager.js");
const Message = require("./Message.js");

/**
 * Gestionnaire de Message
 * @param {Array} adminsId
 * @returns {MessagesManager}
 */
class MessagesManager extends ObjectsManager {
	constructor(adminsId) {
		super(adminsId, undefined, Message);
	}
}

module.exports = MessagesManager;
