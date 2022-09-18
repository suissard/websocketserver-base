import io from "socket.io-client";
import ClientCache from "./ClientCache.js";

/**
 * Systeme de lien websocket et gestion d'un cache de données
 */
export default class WebSocketClient {
	constructor(domain = "localhost", port = 3000, protocole = "http", handlers = {}) {
		this.url = `${protocole}://${domain}:${port}`;
		this.cache = new ClientCache();

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
		};

		this.handlers = handlers;
		this.eventNotifs = ["success", "error", "info", "warning"];
		this.connectSocket();
		// this.setListeners(this.nativeListeners, handlers);
	}

	/**
	 * Methode pour initier la connexion et déclencher les listeners.
	 * Si la conenxion ne se fait pas au bout de 5 seconde, une notif d'erreur apparait
	 */
	async connectSocket() {
		console.log("Connexion à " + this.url);
		let socket = await io(this.url, { cors: { origins: "*" } });
		this.socket = socket;
		this.timeoutConnexion(); //TODO verification régulière ?
		this.restore();
		this.login();
		this.socket.on("connect_error", () => {
			// console.log('ERROR', err)
			//TODO tenter une reconnection ?
			this.timeoutConnexion();
		});
		this.setListeners(this.nativeListeners, this.handlers);
	}

	/**
	 * Parametrer les listeners natifs et leur handlers associés et les listeners/handlers secondaires
	 * @param {io.Socket} socket socket emettant l'event
	 * @param {String} listener nom de l'evenement
	 * @param {Function} handler
	 */
	setListeners(nativeListeners, handlers = {}) {
		console.log("🖥 WebsocketServer start");
		this.socket.on("connection", (socket) => {
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
				let authUser = this.users.findUserWithSocket(socket);
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

	timeoutConnexion(timer = 5000) {
		setTimeout(() => {
			if (this.socket && this.socket.connected) return;
			this.socket = undefined;
			this.store.commit("connexion", false);
			this.store.commit("error", true);
			this.store.commit("setUser", { userName: "ERROR" });

			Vue.prototype.$app.notif({
				title: "Connexion impossible",
				timer: 5,
				type: "error",
				message: "Le serveur ne repond pas",
			});
		}, timer);
	}

	/**
	 * Envoie une requete de login avec priorité au données en local si pas d'argument fournit
	 */
	login(data = {}) {
		let { userName, token } = data;
		// if (!userName) userName = localStorage.getItem("userName");
		// if (!token) token = localStorage.getItem("token");
		// // this.socket.emit("Login", { userName, token });
		this.socket.emit("login", { userName, token });
		// Vue.prototype.$dataBase.fetchAll();
	}

	logout() {
		// this.socket.disconnect(true);
		// this.socket = undefined;
		// let userName, token;
		// this.store.commit("setUser", { userName, token });
	}

	/**
	 * Met a jour le localstorage en fonction des données fournit
	 */
	save(data = {}) {
		this.store.commit("setUser", data);
		for (let i in data) localStorage.setItem(i, data[i]);
	}

	/**
	 * Supprime le local storage et les variables du composant
	 */
	clear() {
		// localStorage.removeItem("id");
		// localStorage.removeItem("userName");
		// localStorage.removeItem("token");
		// this.store.commit("setUser", {});
	}

	/**
	 * Charge les données userName et token stocké en local Storage
	 */
	restore() {
		// let localId = localStorage.getItem("id"),
		// 	localUserName = localStorage.getItem("userName"),
		// 	localToken = localStorage.getItem("token"),
		// 	id,
		// 	userName,
		// 	token;
		// if (!localId || localId == "null") id = localId;
		// if (!localUserName || localUserName == "null") userName = localUserName;
		// if (!localToken || localToken == "null") token = localToken;
		// this.store.commit("setUser", { id, userName, token });
	}

	// ======= EMETRE DES EVENTS ====================================================================
	/**
	 * Mettre a jour les sdonnées de l'utilisateur
	 * @param {*} data
	 */
	// updateUser(data = {}) {
	// 	let token = this.store.state.userToken;
	// 	data.token = token;
	// 	this.socket.emit("UpdateUser", data);
	// }

	/**
	 * Connecter l'utilisateur actuel a un lobby
	 * @param {*} lobbyId
	 * @param {*} token Certain lobby necessite un token pour se connecter
	 */
	connectLobby(lobbyId, token) {
		this.socket.emit("ConnectLobby", { lobbyId, token });
	}

	/**
	 * Envoyer une evenement message
	 * @param {*} lobbyId Identifiant du lobby ciblé
	 * @param {*} content Message
	 */
	async sendMessage(lobbyId, content) {
		await this.socket.emit("SendMessage", { lobbyId, content });
	}

	// ======= REACTIONS AUX EVENTS ====================================================================
	/**
	 * Reception d'un evenement login
	 */
	handleLogin(data) {
		this.save(data);
		this.store.commit("connexion", true);

		// if (userName != localUserName && token != localToken) this.login(this.userName, this.token);
	}

	handleLogout() {}

	handleDisconnect() {}

	handleUpdateUser(data) {
		this.save(data);
	}

	handleConnectLobby(data) {
		this.data.setLobby(data);
		this.store.commit("refreshActiveTchatMessages");
	}

	handleDisconnectLobby() {}

	handleData(data) {
		data.type = data.type.split("/");

		let type = data.type.shift();
		let id = data.type.shift();

		if (type == "users") {
			if (id) this.data.setUser(data.data);
			else this.data.setUsers(data.data);
		} else if (type == "lobbys") {
			if (id) this.data.setLobby(data.data);
			else this.data.setLobbys(data.data);
		} else if (type == "messages") {
			if (id) this.data.setMessage(data.data);
			else this.data.setMessages(data.data);
		}
	}

	//===== TCHAT ==================================================================
	handleSendMessage(data) {
		this.data.setMessage(data);
		if (this.store.state.activeTchatLobbyId == data.lobbyId)
			this.store.commit("refreshActiveTchatMessages");
	}
	handleReceivedMessage(data) {
		data;
	}
	handleViewedMessage(data) {
		data;
	}

	handleTypingMessage(data) {
		data;
	}

	handleGetData(data) {
		let { type, id } = data;
		this.cache.create(id, type, data);
	}

	handleGetAllData(data) {
		for (let i in data) this.handleData(data[i]);
	}

	handleUpdateData() {
		let { type, id } = data;
		this.cache.update(id, type, data);
	}
	handledeleteData() {
		let { type, id } = data;
		this.cache.delete(id, type, data);
	}

	//===== NOTIFICATIONS ==========================================================
	handlesuccess(data) {
		console.log("success", data);
		// Vue.prototype.$app.notif({
		// 	title: data.title,
		// 	type: "success",
		// 	timer: data.timer ? data.timer : 5,
		// 	message: data.message ? data.message : undefined,
		// });
	}
	handleerror(data) {
		console.error("Error", data);
		// Vue.prototype.$app.notif({
		// 	title: data.title,
		// 	type: "error",
		// 	timer: data.timer ? data.timer : 5,
		// 	message: data.message ? data.message : undefined,
		// });
	}
	handlewarning(data) {
		console.warn("warning", data);
		// Vue.prototype.$app.notif({
		// 	title: data.title,
		// 	type: "warning",
		// 	timer: data.timer ? data.timer : 5,
		// 	message: data.message ? data.message : undefined,
		// });
	}
	handleinfo(data) {
		console.info("info", data);
		// Vue.prototype.$app.notif({
		// 	title: data.title,
		// 	type: "info",
		// 	timer: data.timer ? data.timer : 5,
		// 	message: data.message ? data.message : undefined,
		// });
	}

	handledataUpdate(data) {
		let { topic, value /*, oldValue */ } = data;
		Vue.prototype.$app.$store.commit("setBD", {
			type: "topics",
			id: topic,
			value: { id: topic, value },
		});
	}
}
