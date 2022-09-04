const Message = require("./Message.js");
const ManageableObject = require("./ManageableObject.js");
const MessagesManager = require("./MessagesManager.js");

/**
 * Salon d'utilisateurs permettant l'usage de message instantané
 * @param {Number} id identifiant pour retrouver
 * @param {User} owner Propriétaire de l'objet
 * @param {String} token Token permettant l'acces si visibility = false
 * @param {Object} data Données de l'objet
 * @param {Array} data.messages liste de message associé au salon
 * @param {Boolean} visibility Est ce qeu l'object est visible sans token
 * @param {Number} createdAt Timestamp de creation
 * @param {Number} updatedAt Timestamp de la derniere mise a jour
 * @returns {Lobby}
 */
class Lobby extends ManageableObject {
	constructor(id, owner, token, data = {}, visibility, users = [], createdAt, updatedAt) {
		super(id, owner, token, data, visibility, users, createdAt, updatedAt);
		this.setMessages(data.messages);
	}

	/**
	 * Définit une liste de message comme les messages du lobby
	 * @param {Array} messages
	 * @returns {MessagesManager}
	 */
	setMessages(messages) {
		this.messages = new MessagesManager();
		for (let i in messages) {
			let message = messages[i];
			this.messages.create(
				message.getOwner(),
				{
					content: message.content,
					replied: message.replied,
					distributed: message.distributed,
					received: message.received,
					viewed: message.viewed,
				},
				message.getToken(),
				message.getVisibility(),
				message.getId(),
				message.createdAt,
				message.updatedAt
			);
		}
		return this.messages;
	}

	getPartialEntrie() {
		return super.getPartialEntrie().concat(["description", "sizeLimit"]);
	}
	/**
	 * Connecter un user au lobby si il reste de la place est que le token d'entrée est correct
	 * @param {User} user utilisateur a connecter au lobby
	 */
	connect(user) {
		this.addUser(user);
		user.lobbys.set(this.getId(), this);
		this.emitToAll("ConnectLobby", this.getPublicInfo());
	}

	/**
	 * Déconnecter un utilisateur du lobby
	 * @param {User} User
	 */
	disconnect(user) {
		this.deleteUser(user);
		user.lobbys.delete(this.getId(), this);
		this.emitToAll("DisconnectLobby", this.getPublicInfo());
	}

	/**
	 * Emettre un evenement message vers les utilisateurs du lobby et indiquer a qui il a été distribué
	 * @param {Message} message
	 */
	sendMessage(message) {
		const users = this.getUsers();
		for (let id in users) {
			let user = users[id];
			if (user.emit("SendMessage", message.getPartialInfo()))
				message.addDistributed(user);
		}
	}

	/**
	 * Creer un mesage et l'envoie au utilisateur du lobby
	 * @param {String} content contenus du message
	 * @param {User} user Auteur du message
	 * @returns {Message}
	 */
	createMessage(content, user) {
		let message = this.messages.create(user, { content, lobby: this }, this.token);
		this.sendMessage(message);
		return message;
	}

	/**
	 * Récuperer les messages du lobby, par ordre croissant de date de création
	 * @returns {Array}
	 */
	getMessages() {
		let messageArray = [];
		this.messages.forEach((x) => messageArray.push(x.getPartialInfo()));
		return messageArray.sort((a, b) => a.createdAt - b.createdAt);
	}

	getPrivateInfo() {
		let info = super.getPrivateInfo();
		info.messages = this.getMessages();
		return info;
	}
}

module.exports = Lobby;
