const uuidv4 = require("uuid").v4;
const axios = require("axios");
const User = require("./User.js");
const ObjectsManager = require("./ObjectsManager.js");

const STRAPI_URL = "http://localhost:1337";

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
	 * Find a user by their Strapi ID.
	 * @param {number} strapiId
	 * @returns {User|undefined}
	 */
	findUserByStrapiId(strapiId) {
		if (!strapiId) return undefined;
		for (let [id, user] of this) {
			if (user.strapiId === strapiId) return user;
		}
		return undefined;
	}

	/**
	 * Authenticates a user against the Strapi API.
	 * Creates a new user if they don't exist, or reconnects them if they do.
	 * @param {Socket} socket
	 * @param {Object} data
	 * @param {string} data.identifier - The username or email for Strapi.
	 * @param {string} data.password - The password for Strapi.
	 */
	async loginUser(socket, data) {
		const { identifier, password } = data;
		if (!identifier || !password) {
			throw new Error("Identifier and password are required.");
		}

		try {
			const response = await axios.post(`${STRAPI_URL}/api/auth/local`, {
				identifier,
				password,
			});

			const { jwt, user: strapiUser } = response.data;

			let existingUser = this.findUserByStrapiId(strapiUser.id);

			if (existingUser) {
				// User exists, it's a reconnection.
				existingUser.token = jwt; // Update the token
				this.update(existingUser.getId(), existingUser, {
					username: strapiUser.username,
				});
				return this.reconnectUser(socket, existingUser);
			} else {
				// User does not exist, create a new one.
				const user = this.create(true, {
					socket,
					token: jwt,
					strapiId: strapiUser.id,
					username: strapiUser.username,
				});
				return user;
			}
		} catch (error) {
			const errorMessage =
				error.response?.data?.error?.message || "Invalid credentials";
			console.error("Strapi authentication failed:", errorMessage);
			throw new Error(`Authentication failed: ${errorMessage}`);
		}
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
