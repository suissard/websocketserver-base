// Serveur WebSocket universel
const io = require("socket.io"); //(3000, { cors: { origin: "*" } });

const LobbysManager = require("./LobbysManager.js");
const UsersManager = require("./UsersManager.js");

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
			update_data: this.handleUpdateData,

			use_action: this.handleUseAction,
		};

		this.handlers = handlers;

		this.collections = {
			users: new UsersManager(this),
			lobbys: new LobbysManager(this),
		};

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
				let authUser = this.collections.users.findUserWithToken(data.token);
				if (!authUser) authUser = this.collections.users.findUserWithSocket(socket);

				if (!authUser && !["login", "connexion", 'disconnect'].includes(listener))
					throw new Error("Need authentication");
				console.log(
					`📥 ${listener == "login" && authUser ? "reconnexion" : listener} :`,
					authUser ? `user ${authUser.getId()}` : "anonymous",
					socket.request.connection.remoteAddress
				);
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
		const info = this.collections.users.getInfo(user.getId(), user);
		user.emit("login", info);
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
			lobby = this.collections.lobbys.create(authUser, data, token, data.lobby.visibility, id);

		this.collections.lobbys.connect(id, authUser, token); // Connection d'un utilisateur

		const info = this.collections.lobbys.getInfo(lobby.getId(), authUser);
		authUser.emit("connect_lobby", info);
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
		let lobby = this.collections.lobbys.checkUserAccess(id, authUser.getId(), token);
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
		let lobbyServer = this.collections.lobbys.checkUserAccess(id, authUser.getId(), token);
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
			authUser.getId(),
			lobby.token
		);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser.getId(),
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
			authUser.getId(),
			lobby.token
		);
		const messageObject = lobbyObject.messages.checkUserAccess(
			message.id,
			authUser.getId(),
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
			authUser.getId(),
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
	
	handleUpdateData(authUser, socket, data) {
		let { token, type, id } = data;
		if (!this.collections[type]) throw new Error(`Le type "${type}" n'existe pas`);
		this.collections[type].update(id, authUser, data);
	}

	handleUseAction(authUser, socket, data) {
		let {  type, id, action, actionArgs, actionToken } = data;
		if (!this.collections[type]) throw new Error(`Le type "${type}" n'existe pas`);
		this.collections[type].useAction(id, authUser, actionToken, action, actionArgs);
	}
}

module.exports = Server;
