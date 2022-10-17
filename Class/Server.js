// Serveur WebSocket universel
import io from "socket.io"; //(3000, { cors: { origin: "*" } });

import LobbysManager from "./LobbysManager.js";
import UsersManager from "./UsersManager.js";

/**
 *
 * @param {*} srv
 * @param {*} options
 * @param {*} handlers function associé a un listener (pas de fonction anonyme)
 */
class Server extends io.Server {
	constructor(srv, options, handlers = {}) {
		super(srv, options);

		this.nativeListeners = {
			login: this.handleLogin,
			logout: this.handleLogout,
			disconnect: this.handleDisconnect,

			connect_lobby: this.handleConnectLobby,
			disconnect_lobby: this.handleDisconnectLobby,

			send_message: this.handleSendMessage,
			received_message: this.handleReceivedMessage,
			viewed_message: this.handleViewedMessage,
			typing_message: this.handleTypingMessage,

			get_data: this.handleGetData,
			get_all_data: this.handleGetAllData,
			update_Data: this.handleUpdateData,
		};

		this.handlers = handlers;

		this.collections = { users: new UsersManager(), lobbys: new LobbysManager() };

		this.setListeners(this.nativeListeners, handlers);
	}

	/**
	 * Parametrer les listeners natifs et leur handlers associés et les listeners/handlers secondaires
	 * @param {io.Socket} socket socket emettant l'event
	 * @param {String} listener nom de l'evenement
	 * @param {Function} handler
	 */
	setListeners(nativeListeners, handlers = {}) {
		console.log("🖥 WebsocketServer start");
		this.on("connection", (socket) => {
			this.handleConnection(socket);

			//Event natif
			for (let listener in nativeListeners) {
				let handler = this.nativeListeners[listener];
				this.setListener(socket, listener, handler);
			}

			//Event externe
			for (let listener in handlers) {
				let handler = handlers[listener];
				this.setListener(socket, listener, handler);
			}
		});
	}

	/**
	 * Parametrer un listener et sont handler associé
	 * @param {io.Socket} socket socket emettant l'event
	 * @param {String} listener nom de l'evenement
	 * @param {Function} handler
	 */
	setListener(socket, listener, handler) {
		socket.on(listener, (data) => {
			try {
				let authUser = this.collections.users.findUserWithSocket(socket);
				if (!authUser && !["login", "connexion"].includes(listener))
					throw new Error("Need authentication");

				handler.bind(this, authUser, socket, data)();
			} catch (error) {
				console.error(
					`ERROR ${listener} from ${socket.request.connection.remoteAddress}`,
					data,
					error
				);
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
	handleLogin(authUser, socket, data) {
		let user = this.collections.users.loginUser(socket, data);
		user.emit("login", this.collections.users.getInfo(user.getId(), user));
	}

	handleUpdateData(authUser, socket, data) {
		let { token, type, id } = data;
		if (!this.collections[type]) throw new Error(`Le type "${type}" n'existe pas`);
		this.collections[type].update(id, authUser, data);
	}

	/**
	 * Evenement de deconnection d'un utilisateur
	 * TODO plutot suppression de compte
	 * @param {Socket} socket
	 */
	handleLogout(authUser) {
		if (!authUser) throw new Error(`Utilisateur déjà déconnecté`);
		this.collections.users.logoutUser(authUser);
	}

	handleDisconnect(authUser, socket, data) {}

	/**
	 * Evenement de connexion a un lobby
	 * TODO a tester
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleConnectLobby(authUser, socket, data) {
		let {
			lobby: { id, token },
		} = data;

		if (id === undefined) throw new Error("Pas d'id de lobby fournit");

		let lobby = this.collections.lobbys.get(id);
		if (!lobby)
			lobby = this.collections.lobbys.create(authUser, data, token, undefined, id);

		this.collections.lobbys.connect(id, authUser, token); // Connection d'un utilisateur
		authUser.emit(
			"connect_lobby",
			this.collections.lobbys.getInfo(lobby.getId(), authUser)
		);
	}

	/**
	 * Evenement de deconnexion à un lobby
	 * TODO a tester
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleDisconnectLobby(authUser, socket, data) {
		let {
			lobby: { id, token },
		} = data;
		let lobby = this.collections.lobbys.checkUserAccess(id, authUser, token);
		lobby.disconnect(authUser); // Déconnection d'un utilisateur
	}

	// EVENEMENT DE MESSAGES ================================================
	/**
	 * Evenement d'envois de message dans un lobby
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleSendMessage(authUser, socket, data) {
		let {
			lobby: { id, token },
			content,
		} = data;
		let lobbyServer = this.collections.lobbys.checkUserAccess(id, authUser, token);
		return lobbyServer.createMessage(content, authUser);
	}

	/**
	 * Evenement de confirmation de reception de message
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleReceivedMessage(authUser, socket, data) {
		let { lobby, message, token } = data;
		const lobbyObject = this.collections.lobbys.checkUserAccess(
			lobby.id,
			authUser,
			lobby.token
		);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser,
			lobby.token
		);
		messageObject.addReceived(authUser);
	}

	/**
	 * Evenement de confirmation de message vus par l'utilisateur
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleViewedMessage(authUser, socket, data) {
		let { lobby, message, token } = data;
		const lobbyObject = this.collections.lobbys.checkUserAccess(
			lobby.id,
			authUser,
			lobby.token
		);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser,
			lobby.token
		);
		messageObject.addViewed(authUser);
	}

	/**
	 * Evenement de début d'écriture d'un utilisateur
	 * @param {Socket} socket
	 * @param {Object} data
	 */
	handleTypingMessage(authUser, socket, data) {
		let { lobby, token } = data;
		const lobbyObject = this.collections.lobbys.checkUserAccess(
			lobby.id,
			authUser,
			token
		);

		lobbyObject.typing(authUser);
	}

	//EVENEMENT DE DATA ======================================================
	handleGetData(authUser, socket, data) {
		let { id, type, token } = data;
		let result = this.collections[type].getInfo(id, authUser, token);
		authUser.emit("get_data", JSON.stringify(result));
	}

	handleGetAllData(authUser, socket, data) {
		for (let type in this.collections) {
			let result = this.collections[type].getInfos(authUser, data.token);
			authUser.emit("get_all_data", JSON.stringify({ type, datas: result }));
		}
	}

	//EVENEMETN DE TOPIC ======================================================
	handlePublishTopic(authUser, socket, data) {
		console.log("handlePublishTopic", data);
		let { topic, value } = data;
		this.client.publish(topic, value);
	}
	handleConnectedObjectAction(authUser, socket, data) {
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

export default Server;
