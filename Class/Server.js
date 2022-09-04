// Serveur WebSocket universel
const io = require("socket.io"); //(3000, { cors: { origin: "*" } });

const LobbysManager = require("./LobbysManager.js");
const UsersManager = require("./UsersManager.js");

/**
 *
 * @param {*} srv
 * @param {*} options Option du server
 */
class Server extends io.Server {
	/**
	 *
	 * @param {*} srv
	 * @param {*} options
	 */
	constructor(srv, options, handlers = {}) {
		super(srv, options);
		//TODO construire les event et leur function asscoccié, dans des fichier indépednant
		this.nativeListeners = [
			"Login",
			"Logout",
			"Disconnect",
			"UpdateUser",

			"ConnectLobby",
			"DisconnectLobby",

			"SendMessage",
			"ReceivedMessage",
			"ViewedMessage",
			"TypingMessage",

			"Data",
			"GetAll",
		];

		this.handlers = handlers;

		this.users = new UsersManager();
		this.lobbys = new LobbysManager();

		this.setListeners(this.nativeListeners, handlers);
	}

	setListeners(nativeListeners, handlers = {}) {
		console.log("🖥 WebsocketServer start");
		this.on("connection", (socket) => {
			this.handleConnection(socket);

			for (let i in nativeListeners) {
				let listener = this.nativeListeners[i];
				try {
					if (!this[`handle${listener}`] || handlers[listener]) continue;
					socket.on(listener, (data) => {
						let authUser = this.users.findUserWithSocket(socket);
						if (!authUser && !["Login", "connexion"].includes(listener))
							throw new Error("Need authentication");

						try {
							console.log(
								`📥 ${listener} from ${socket.id}--${socket.request.connection.remoteAddress}`,
								data
							);
							this[`handle${listener}`](authUser, data, socket);
						} catch (error) {
							console.error(
								`ERROR ${listener} from ${socket.request.connection.remoteAddress}`,
								data,
								error
							);
							// authUser.error(error.message);
						}
					});
				} catch (error) {
					console.error(listener, error);
				}
			} // Differents évenements a écouter

			for (let listener in handlers) {
				let handler = handlers[listener];
				socket.on(listener, (data) => {
					let authUser = this.users.findUserWithSocket(socket);
					if (!authUser)
						throw new Error("Need authentication")
					handler(authUser, data, socket);
				});
			}
		});
	}

	// PRISE EN CHARGE DES EVENEMENTS ========================================================================================
	/**
	 * Connection initial au server d'un client. SI pas d'utilisateur correspondant, en créer un
	 * @param {Socket} socket
	 */
	handleConnection(socket) {
		console.log(`📥 Connection depuis`, socket.request.connection.remoteAddress);
	}

	/**
	 * Evenement de connexion ou reconnexion d'un utilisateur
	 * verifie le token fournit avec ceux existant et associe le socket
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleLogin(authUser, data, socket) {
		let user = this.users.loginUser(socket, data);
		user.emit("Login", this.users.getInfo(user.getId(), user));

		// TODO Envoyer toutes les informations
		// for (let i in allData) user.emit("dataUpdate", allData[i]);
	}

	/**
	 * Evenement de mise a jour d'un utilisateur
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleUpdateUser(authUser, data, socket) {
		let { username, token } = data;
		//verifie si existance d'un utilisateur relié a ce token
		let user = this.users.checkUserAccess(authUser.getId(), authUser, token);
		// let user = this.users.findUserWithToken(token);
		if (!user) {
			if (!authUser)
				return socket.emit("error", {
					title: "Bug du serveur",
					message: "Raffraichissez la page",
				});
			throw new Error({
				title: `Changement de nom impossible`,
				message: "Le token d'authentification est invalide",
			});
		}
		this.users.updateUser(user, data);
	}

	/**
	 * Evenement de deconnection d'un utilisateur
	 * TODO plutot suppression de compte
	 * @param {Socket} socket
	 */
	handleLogout(authUser) {
		if (!authUser) throw new Error(`Utilisateur déjà déconnecté`);
		this.users.logoutUser(authUser);
	}

	handleDisconnect(authUser) {}

	/**
	 * Evenement de connexion a un lobby
	 * TODO a tester
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleConnectLobby(authUser, data) {
		let { id, token } = data;

		if (id === undefined) throw new Error("Pas d'id de lobby fournit");

		let lobby = this.lobbys.get(id);
		if (!lobby) lobby = this.lobbys.create(authUser, data, token, undefined, id);

		this.lobbys.connect(id, authUser, token); // Connection d'un utilisateur
		authUser.emit("ConnectLobby", this.lobbys.getInfo(lobby.getId(), authUser));
	}

	/**
	 * Evenement de deconnexion à un lobby
	 * TODO a tester
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleDisconnectLobby(authUser, data) {
		console.log(authUser.username, data);
		let { id, token } = data;
		let lobby = this.lobbys.checkUserAccess(id, authUser, token);
		lobby.disconnect(authUser); // Déconnection d'un utilisateur
	}

	// EVENEMENT DE MESSAGES ================================================
	/**
	 * Evenement d'envois de message dans un lobby
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleSendMessage(authUser, data) {
		let { id, token, content } = data;
		let lobby = this.lobbys.checkUserAccess(id, authUser, token);
		return lobby.createMessage(content, authUser);
	}

	/**
	 * Evenement de confirmation de reception de message
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleReceivedMessage(authUser, data) {
		let { lobby, message, token } = data;
		const lobbyObject = this.lobbys.checkUserAccess(lobby.id, authUser, token);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser,
			token
		);
		messageObject.addReceived(authUser);
	}

	/**
	 * Evenement de confirmation de message vus par l'utilisateur
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleViewedMessage(authUser, data) {
		let { lobby, message, token } = data;
		const lobbyObject = this.lobbys.checkUserAccess(lobby.id, authUser, token);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser,
			token
		);
		messageObject.addViewed(authUser);
	}

	/**
	 * Evenement de début d'écriture d'un utilisateur
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleTypingMessage(authUser, data) {
		let { lobby, message, token } = data;
		const lobbyObject = this.lobbys.checkUserAccess(lobby.id, authUser, token);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser,
			token
		);
		messageObject.typing(authUser);
	}

	//EVENEMENT DE DATA ======================================================
	handleData(authUser, data) {
		let result = this;

		let path = data.split("/");

		for (let i in path) {
			if (result[path[i]] !== undefined) result = result[path[i]];
			else result = result.get(path[i]);
		}
		result = result.getInfos(authUser);

		authUser.emit("Data", { type: data, data: result });
	}

	handleGetAll(authUser, data) {
		console.log("GetAll", data);
		authUser.emit("GetAll", { type: data, data: JSON.stringify(this.Data) });
	}

	//EVENEMETN DE TOPIC ======================================================
	handlePublishTopic(authUser, data) {
		console.log("handlePublishTopic", data);
		let { topic, value } = data;
		this.client.publish(topic, value);
	}
	handleConnectedObjectAction(authUser, data) {
		console.log("handleConnectedObjectAction", data);
		let { id, type, action, actionID, args } = data;
		let connectedObject = this.client.ConnectedObjects[type].get(id);
		if (!connectedObject) throw new Error("L'objet n'est pas référencé", authUser);
		try {
			connectedObject
				.useAction(action, actionID, args, authUser)
				.then((response) => authUser.emit("awaitResponse", response))
				.catch((err) => {
					authUser.emit("error", err);
				});
		} catch (e) {
			throw new Error(e.message, authUser);
		}
	}
}

module.exports = Server;
