const Lobby = require("./Lobby.js");
const ObjectsManager = require("./ObjectsManager.js");

/**
 * Gestionnaire de Lobby
 * @param {Array} adminsId
 * @returns {LobbysManager}
 */
class LobbysManager extends ObjectsManager {
	constructor(server, adminsId = [] ) {
		super(server, adminsId, undefined, Lobby );
		return this;
	}

	/**
	 * Connecter un user au lobby si il reste de la place est que le token d'entrée est correct
	 * @param {String} id
	 * @param {User} user
	 * @param {String || undefined} token
	 */
	connect(id, user, token) {
		let lobby = this.checkUserAccess(id, user.getId(), token);
		if (lobby.getUsers().length >= lobby.sizeLimit && lobby.sizeLimit)
			throw new Error(`Lobby ${lobby.getId()} is full`);
		lobby.connect(user);
	}
}

module.exports = LobbysManager;
