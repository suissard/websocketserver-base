const User = require("./User.js");
const ManageableObject = require("./ManageableObject.js");

/**
 * Message instantané
 * @param {Number} id identifiant pour retrouver
 * @param {User} owner Propriétaire de l'objet
 * @param {String} token Token permettant l'acces si visibility = false
 * @param {Object} data Données de l'objet
 * @param {String} data.content Contenu du message
 * @param {Message} data.replied message auque ce message répond
 * @param {Array} data.distributed liste d'utilisateur a qui le message a été distribué
 * @param {Array} data.received liste d'utilisateur qui ont recu le message
 * @param {Array} data.viewed liste d'utilisateur a qui ont vue le message
 * @param {Boolean} visibility Est ce qeu l'object est visible sans token
 * @param {Number} createdAt Timestamp de creation
 * @param {Number} updatedAt Timestamp de la derniere mise a jour
 * @returns {Lobby}
 */
class Message extends ManageableObject {
	constructor(id, owner, token, data, visibility, users, createdAt, updatedAt) {
		super(id, owner, token, data, visibility, users, createdAt, updatedAt);
		if (!(typeof data.content == "string"))
			throw new Error("Content fournit n'est pas du bon type");

		this.replied = this.replied || undefined; //doit etre un message
		this.distributed = this.distributed || new Array(); //Contient des Id d'utilisateurs
		this.received = this.received || new Array(); //Contient des Id d'utilisateurs
		this.viewed = this.viewed || new Array(); //Contient des Id d'utilisateurs
	}

	addDistributed(user) {
		if (!this.distributed.includes(user.getId())) this.distributed.push(user.getId());
		this.lobby.emitToAll("DistributedMessage", {
			message: this.getPublicInfo(),
			user: user.getPublicInfo(),
		});
	}

	addReceived(user) {
		if (!this.received.includes(user.getId())) this.received.push(user.getId());
		this.lobby.emitToAll("received_message", {
			message: this.getPublicInfo(),
			user: user.getPublicInfo(),
		});
	}

	addViewed(user) {
		if (!this.viewed.includes(user.getId())) this.viewed.push(user.getId());
		this.lobby.emitToAll("viewed_message", {
			message: this.getPublicInfo(),
			user: user.getPublicInfo(),
		});
	}

	typing(user) {
		this.lobby.emitToAll("typing_message", {
			message: this.getPublicInfo(),
			user: user.getPublicInfo(),
		});
	}
	reply(content, user) {
		this.lobby.send(content, user);
	}

	getPartialProperty() {
		return super
			.getPartialProperty()
			.concat(["content", "lobby", "replied", "distributed", "received", "viewed"]);
	}
	getPartialInfo() {
		return {
			...super.getPartialInfo(),
			lobby: this.lobby.getPublicInfo(),
		};
	}

	getPublicInfo() {
		return {
			...super.getPublicInfo(),
			lobby: this.lobby.getPublicInfo(),
		};
	}
}

module.exports = Message;
