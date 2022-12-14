const uuidv4 = require("uuid").v4;
const User = require("./User.js");
const ObjectsManager = require("./ObjectsManager.js");

class UsersManager extends ObjectsManager {
	/**
	 * Gere une collection d'utilisateurs (source de verité, instance unique)
	 */
	constructor(server, adminsId = [] ) {
		super(server, adminsId, undefined, User );
	}

	getIdCalculator() {
		return uuidv4();
	}

	/**
	 * Trouve et remonte le premier utilisateur au token correspondant
	 * @param {String} token
	 * @returns {User}
	 */
	findUserWithToken(token) {
		if (!token) return undefined;
		for (let [id, user] of this) {
			if (user.getToken() == token) return user;
		}
		return false;
	}

	/**
	 * Trouve et remonte le premier utilisateur au socket Id correspondant
	 * @param {String} socketId
	 * @returns {User}
	 */
	findUserWithSocket(socket) {
		for (let [id, user] of this) if (user.socket.id == socket.id) return user;
		return false;
	}

	/**
	 * Changement de socket : Modifie l'utilisateur et change la base socketsUsers
	 * @param {Socket} socket
	 * @param {String} user
	 */
	reconnectUser(socket, user) {
		//supprimer l'utilisateur inutile des collections
		for (let [id, value] of this)
			if (value.socket.id == socket.id && value.getId() != user.getId()) {
				this.delete(user.getId(), user);
				this.set(id, user);
				user.setId(id);
			}

		user.socket = socket;
		user.emit("login", user.getPrivateInfo());
		user.success("Reconnection reussi " + user.username);
		return user;
	}

	/**
	 * Connection d'un utilisateur : relier socket.id a un User (ancien ou nouveau)
	 * @param {Socket} socket
	 * @param {*} token
	 * @param {*} username
	 */
	loginUser(socket, data) {
		let { token, id, username } = data;
		let tokenUser = this.findUserWithToken(token);
		let socketUser = this.findUserWithSocket(socket);

		//si token correspond a un utilisateur, c'est une reconnexion
		if (tokenUser || socketUser) {
			this.update((tokenUser || socketUser).getId(), tokenUser || socketUser, data);
			return this.reconnectUser(socket, tokenUser || socketUser);
		}

		let user = this.create(true, { socket, username }); // Creer un utilisateur
		if (username) this.update(user.getId(), user, data);
		return user;
	}

	/**
	 * deconnection d'un utilisateur
	 * @param {User} user
	 */
	logoutUser(user) {
		this.delete(user.getId(), user);
		user.warning(`Tu est déconnecté`);
	}

	getInfos(authUser, token) {
		let result = [];
		this.forEach((user) => {
			let info = this.getInfo(user.getId(), authUser, token);
			if (info) result.push(info);
		});
		return result;
	}

	/**
	 * Envoyer un evenement a tout les utilisateurs du lobby
	 * @param {Object} data
	 */
	emitToAll(eventType, data) {
		for (let [id, user] of this) if (user.isConnect()) user.emit(eventType, data); // Envoyer a tout les utilisateurs
	}

	/**
	 * Emettre un evenement message vers les utilisateurs du lobby
	 * TODO quel format pour les messages ?
	 * @param {Object} data
	 */
	sendToAll(data) {
		this.emitToAll("send_message", data);
	}

	// FONCTIONS DE NOTIFICATION ==========================================================================================
	/**
	 * Emet un evenement de notification aux utilisateurs
	 * @param {String} event type d'evenement (success, error, warning, info)
	 * @param {String || Object} data Contenue de la notif
	 */
	notifToAll(eventType, data) {
		if (data instanceof Object && !data.title)
			throw new Error(`Si data est un object, il doit contenir un title`);
		if (!data.title) data = { title: data };
		this.emitToAll(eventType, { type: eventType, ...data });
	}

	/**
	 * Evenement notifiant un succes pour tout les utilisateurs
	 * @param {Object || String} data Objet avec les donnée de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	successToAll(data) {
		this.notifToAll("success", data);
	}
	/**
	 * Evenement notifiant une erreur pour tout les utilisateurs
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	errorToAll(data) {
		this.notifToAll("error", data);
	}
	/**
	 * Evenement notifiant une info pour tout les utilisateurs
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	infoToAll(data) {
		this.notifToAll("info", data);
	}
	/**
	 * Evenement notifiant un warning pour tout les utilisateurs
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	warningToAll(data) {
		this.notifToAll("warning", data);
	}
}

module.exports = UsersManager;
