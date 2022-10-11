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

		/**
	 * Récuperer les messages du lobby, par ordre croissant de date de création
	 * @returns {Array}
	 */
		 getMessages() {
			let messageArray = [];
			this.forEach((x) => messageArray.push(x.getPartialInfo()));
			return messageArray.sort((a, b) => a.getCreatedAt() - b.getCreatedAt());
		}
}

module.exports = MessagesManager;
