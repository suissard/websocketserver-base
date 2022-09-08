const ManageableObject = require("./ManageableObject.js");

class User extends ManageableObject {
	/**
	 *
	 * @param {Number} id Numero identifiant
	 * @param {Socket} socket Socket actuellement utilisé par l'utilisateur
	 * @param {String} token Token permettant de s'authentifier depuis le client
	 * @param {String} username Nom définit par l'utilisateur ou User X
	 * @param {Boolean} visible Utilisateur visible par tous
	 * @param {Number} createdAt Timestamps de creation
	 */
	constructor(id, owner, token, data, visibility, users = [], createdAt, updatedAt) {
		super(id, owner, token, data, visibility, (users = []), createdAt, updatedAt);
		this.setOwner(this);

		this.lobbys = data.lobbys ? this.setLobbys(lobbys) : new Map(); // Gestionnaire de salon où se trouve l'utilisateur
	}

	/**
	 * Récuperer la liste des id des Lobby
	 * @returns {Array}
	 */
	getLobbys() {
		let result = [];
		this.lobbys.forEach((lobby) => result.push(lobby.getId()));
		return result;
	}
	/**
	 * Creer une map d'id  ou de lobby a partir d'un array
	 * @param {Array} lobbysArray base pour créer une map d'id ou de Lobby (si une collection est fournit)
	 * @returns {Map}
	 */

	setLobbys(lobbysArray) {
		let result = new Map();
		lobbysArray.forEach((lobby) => result.set(lobby.getId(), lobby));
		return result;
	}

	getUpdatableProperty() {
		return super.getUpdatableProperty().concat(["username"]);
	}

	// FONCTIONS DE NOTIFICATION ==========================================================================================
	/**
	 * Emet un evenement de notification a l'utilisateur client
	 * @param {String} eventType type d'evenement (success, error, warning, info)
	 * @param {String || Object} data Contenue de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	notif(eventType, data) {
		if (data instanceof Object && !data.title)
			throw new Error(`Si data est un object, il doit contenir un title`);
		if (!data.title) data = { title: data };
		this.emit(eventType, { type: eventType.toLowerCase(), ...data });
	}
	/**
	 * Evenement notifiant un succes pour l'utilisateur
	 * @param {Object || String} data Objet avec les donnée de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	success(data) {
		this.notif("success", data);
	}
	/**
	 * Evenement notifiant une erreur pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	error(data) {
		this.notif("error", data);
	}
	/**
	 * Evenement notifiant une info pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	info(data) {
		this.notif("info", data);
	}
	/**
	 * Evenement notifiant un warning pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	warning(data) {
		this.notif("warning", data);
	}

	//================================================================================================

	/**
	 * Emettre un evenement message vers l'utilisateur
	 * TODO quel format pour les messages ?
	 * @param {Object} data
	 */
	send(data) {
		this.emit("send_message", data);
	}

	// /**
	//  * Connect l'utilisateur a un lobby
	//  * @param {Lobby} lobby
	//  */
	// connectLobby(lobby, token) {
	// 	lobby.connect(this, token);
	// }

	/**
	 * Envoie un evenement a l'utilisateur
	 * @param {String} eventType
	 * @param {Object} data
	 */
	emit(eventType, data) {
		try {
			this.socket?.emit(eventType, data);
			return true;
		} catch (error) {
			console.error(`BUG Emit pour User ${this.id} : ${error.message}`, error.stack);
			return false;
		}
	}

	/**
	 * Verifie si l'utilisateur partage un lobby commun avec une autre utilisateur
	 * @param {User} user
	 * @returns {Lobby}
	 */
	shareLobby(user) {
		for (let [id, lobby] of this.lobbys) {
			if (lobby.userIsPresent(user)) return lobby;
		}
		return false;
	}

	/**
	 * Verifie si l'utilisateur est connecté
	 * @returns {Boolean}
	 */
	isConnect() {
		return this.socket?.connected;
	}

	getPrivateInfo() {
		let info = super.getPrivateInfo();
		delete info.data.socket;
		return info;
	}
	getPartialProperty() {
		return ["username"].concat(super.getPartialProperty());
	}
	getPublicProperty() {
		return ["username"];
	}
	getPublicInfo() {
		return {
			id: this.getId(),
			visibility: this.getVisibility(),
			type: this.constructor.name.toLowerCase() + "s",
			data: { username: this.username },
		};
	}
}

module.exports = User;
