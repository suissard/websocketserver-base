const User = require("./User.js");

/**
 * Object pouvant etre géré par un manager
 * @param {Number} id identifiant pour retrouver
 * @param {User} owner Propriétaire de l'objet
 * @param {String} token Token permettant l'acces si visibility = false
 * @param {Object} data Données de l'objet
 * @param {Boolean} visibility Est ce qeu l'object est visible sans token
 * @param {Number} createdAt Timestamp de creation
 * @param {Number} updatedAt Timestamp de la derniere mise a jour
 * @returns {ManageableObject}
 */
class ManageableObject {
	constructor(id, owner, token, data = {}, visibility, users = [], createdAt, updatedAt) {
		if (id === undefined || !owner || token === undefined)
			throw new Error(
				`${id === undefined ? "ID " : ""}${!owner ? "OWNER " : ""}${
					token === undefined ? "TOKEN " : ""
				} must be specified`
			);

		this.beforeCreated(id, owner, token, data, visibility, createdAt, updatedAt);
		this.setId(id);
		this.setOwner(owner);
		this.setToken(token);
		this.setVisibility(visibility);
		this.setUsers(users);

		this.createdAt = createdAt || Date.now();
		this.updatedAt = updatedAt || Date.now();

		for (let i in data) {
			if (this[i]) throw new Error(`"${i}" already exist in ${this.constructor.name}`);
			this[i] = data[i];
		}
		return this;
	}

	/**
	 * Récupérer les infos privées liée à l'objet. Reservé au owner et possesseur du token
	 * @returns {Object}
	 */
	getPrivateInfo() {
		const data = {};
		for (let i in this) data[i] = this[i];

		return {
			getId: this.getId(),
			getOwner: this.getOwner().getUserInfo(),
			getToken: this.getToken(),
			getVisibility: this.getVisibility(),
			getUsers: this.getUsers().map((x) => x.getUserInfo()),
			...data,
		};
	}
	/**
	 * Récupérer les entrée pour livrer des infos partielles. Necessite d'etre un utilisateur lié a l'objet (this.userIsPresent())
	 * @returns {Array}
	 */
	getPartialEntrie() {
		return ["createdAt", "updatedAt"];
	}
	/**
	 * Récupérer les infos partielles liée à l'objet
	 * @returns {Object}
	 */
	getPartialInfo() {
		var data = {};
		const partialEntrie = this.getPartialEntrie();
		for (let i in partialEntrie) {
			let entrie = partialEntrie[i];
			data[entrie] = this[entrie];
		}

		data = {
			getId: this.getId(),
			getOwner: this.getOwner().getUserInfo(),
			getVisibility: this.getVisibility(),
			getUsers: this.getUsers().map((x) => x.getUserInfo()),
			...data,
		};
		return data;
	}
	/**
	 * Récupérer les entrée pour livrer des infos partielles
	 * @returns {Array}
	 */
	getPublicEntrie() {
		return [];
	}
	/**
	 * Récupérer les infos publiques liée à l'objet
	 * @returns {Object}
	 */
	getPublicInfo() {
		var data = {};
		const publicEntrie = this.getPublicEntrie();
		for (let i in publicEntrie) {
			let entrie = publicEntrie[i];
			data[entrie] = this[entrie];
		}

		data = {
			getId: this.getId(),
			getOwner: this.getOwner().getUserInfo(),
			getVisibility: this.getVisibility(),
			getUsers: this.getUsers().map((x) => {
				return { id: "XXXX", username: "XXXX" };
			}),
			...data,
		};
		return data;
	}

	/**
	 * Mettre a jour l'object sans remplacer les données system (id, owner, token, visibility via des function) et déclencher les fonctions du cycle de vie
	 * @param {Object} data donnée a modifier
	 * @returns {ManageableObject}
	 */
	update(data) {
		this.beforeUpdated(data);
		for (let i in data) {
			if (
				[
					"getId",
					"getOwner",
					"getToken",
					"getVisibility",
					"setId",
					"setOwner",
					"setToken",
					"setVisibility",
				].includes(i)
			)
				throw new Error(`"${i}" is reserved in ${this.constructor.name}`);
			if (this[i] !== data[i]) this[i] = data[i];
		}
		this.updatedAt = Date.now();

		this.updated(data);
		return this;
	}

	/**
	 * Récuperer l'id system de l'objet
	 * @returns {Number}
	 */
	getId() {
		throw new Error("This function must be overcharge");
	}
	/**
	 * Définir l'id system de l'objet
	 * @param {Number} id
	 */
	setId(id) {
		Object.defineProperty(this, "getId", {
			enumerable: false,
			configurable: true,
			value: () => id,
		});
	}

	/**
	 * Récuperer le proprietaire system de l'objet
	 * @returns {User}
	 */
	getOwner() {
		throw new Error("This function must be overcharge");
	}
	/**
	 * Définir le proprietaire system de l'objet
	 * @param {User} owner
	 */
	setOwner(owner) {
		Object.defineProperty(this, "getOwner", {
			enumerable: false,
			configurable: true,
			value: () => owner,
		});
	}

	/**
	 * Récuperer le token system de l'objet
	 * @returns {String}
	 */
	getToken() {
		throw new Error("This function must be overcharge");
	}
	/**
	 * Définir le token system de l'objet
	 * @param {Boolean} token
	 */
	setToken(token) {
		Object.defineProperty(this, "getToken", {
			enumerable: false,
			configurable: true,
			value: () => token,
		});
	}

	/**
	 * Récuperer la visibilité system de l'objet
	 * @returns {Boolean}
	 */
	getVisibility() {
		throw new Error("This function must be overcharge");
	}
	/**
	 * Définir la visibilité system de l'objet
	 * @param {Boolean} visibility
	 */
	setVisibility(visibility) {
		Object.defineProperty(this, "getVisibility", {
			enumerable: false,
			configurable: true,
			value: () => visibility,
		});
	}

	/**
	 * Récuperer les users system de l'objet
	 * @returns {Array}
	 */
	getUsers() {
		throw new Error("This function must be overcharge");
	}
	/**
	 * Définir les utilisateurs system de l'objet
	 * @param {Array} users
	 */
	setUsers(users = []) {
		Object.defineProperty(this, "getUsers", {
			enumerable: false,
			configurable: true,
			value: () => {
				return users;
			},
		});
	}

	/**
	 * Ajouter un utilisateur pour acceder a l'objet
	 * @param {User} user
	 */
	addUser(user) {
		const newUsers = this.getUsers();
		if (!this.userIsPresent(user)) {
			newUsers.push(user);
			this.setUsers(newUsers);
		}
	}

	/**
	 * Ajouter des utilisateurs pour accceder a l'objet
	 * @param {Array} users
	 */
	addUsers(users) {
		const newUsers = this.getUsers();
		for (let i in users) {
			let user = users[i];
			if (!this.userIsPresent(user)) newUsers.push(user);
		}
		this.setUsers(newUsers);
	}
	/**
	 * Retrait d'un utilisateur, de la liste d'utilisateurs pouvant acceder à l'objet
	 * @param {User} user
	 */
	deleteUser(user) {
		const newUsers = this.getUsers();
		if (this.userIsPresent(user)) {
			newUsers.splice(
				newUsers.findIndex((x) => x.getId() == user.getId()),
				1
			);
			this.setUsers(newUsers);
		}
	}
	/**
	 * Retrait de plusieurs utilisateurs, de la liste d'utilisateurs pouvant acceder à l'objet
	 * @param {Array} users
	 */
	deleteUsers(users) {
		const newUsers = this.getUsers();
		for (let i = newUsers.length - 1; i >= 0; i--) {
			let user = newUsers[i];
			if (this.userIsPresent(user)) {
				newUsers.splice(i, 1);
			}
		}
		this.setUsers(newUsers);
	}

	// CYCLE DE VIE
	/**
	 * Function se déclenchant avant la creation complete de l'objet
	 * @param {*} arguments Tous els arguments necessaire a la creation d l'objet
	 */
	beforeCreated(id, owner, token, data, visibility, createdAt, updatedAt) {}
	/**
	 * Function se déclenchant apres la création complete de l'objet
	 */
	created(id, owner, token, data, visibility, createdAt, updatedAt) {}
	/**
	 * Function se déclenchant avant la mise a jour de l'objet
	 * @param {*} arguments Tous els arguments necessaire a la creation d l'objet
	 */
	beforeUpdated(data) {}
	/**
	 * Function se déclenchant apres la mise a jour de l'objet
	 */
	updated(data) {}
	/**
	 * Function se déclenchant avant la suppression de l'objet
	 * @param {*} arguments Tous els arguments necessaire a la creation d l'objet
	 */
	beforeDeleted() {}
	/**
	 * Function se déclenchant apres la suppression de l'objet
	 */
	deleted() {}

	/**
	 * Token permet-il l'acces a l'objet ?
	 * @param {String} token
	 * @returns {Boolean}
	 */
	tokenGrantAccess(token) {
		return token === this.getToken();
	}
	/**
	 * Utilisateur est-il le proprietaire ?
	 * @param {User} user
	 * @returns {Boolean}
	 */
	userIsOwner(user) {
		return user?.getId() === this.getOwner().getId();
	}

	/**
	 * Est ce qu'un utilisateurs est present ?
	 * @param {User} user
	 * @returns {Boolean}
	 */
	userIsPresent(user) {
		return this.getUsers().find((x) => x.getId() == user?.getId()) ? true : false;
	}

	/**
	 * Est ce que utilisateur et token permettte l'acces aux données
	 * @param {User} user
	 * @param {String} token
	 * @returns {Boolean}
	 */
	checkUserAccess(user, token) {
		if (
			!this.getVisibility() &&
			!this.userIsPresent(user) &&
			!this.userIsOwner(user) &&
			!this.tokenGrantAccess(token)
		)
			return false;
		return true;
	}

	//EVENEMENTS ET NOTIFICATIONS

	/**
	 * Envoyer un evenement a tout les utilisateurs du lobby
	 * @param {String} eventType Type d'evenement
	 * @param {Object} data
	 */
	emitToAll(eventType, data) {
		const users = this.getUsers();
		for (let id in users) {
			let user = users[id];
			user.emit(eventType, data);
		} // Envoyer a tout les utilisateurs
	}

	/**
	 * Emet un evenement de notification aux utilisateurs du lobby
	 * @param {String} event type d'evenement (success, error, warning, info)
	 * @param {String || Object} data Contenue de la notif
	 */
	notifToAll(eventType, data) {
		if (data instanceof Object && !data.title)
			throw new Error(`Si data est un object, il doit contenir un title`);
		if (!data.title) data = { title: data };
		this.emitToAll(eventType, data);
	}

	/**
	 * Evenement notifiant un succes pour l'utilisateur
	 * @param {Object || String} data Objet avec les donnée de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	successToAll(data) {
		this.notifToAll("success", data);
	}
	/**
	 * Evenement notifiant une erreur pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	errorToAll(data) {
		this.notifToAll("error", data);
	}
	/**
	 * Evenement notifiant une info pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	infoToAll(data) {
		this.notifToAll("info", data);
	}
	/**
	 * Evenement notifiant un warning pour l'utilisateur
	 * @param {Object || String} data Objet avec les données de notification ou titre de la notif
	 * @param {String} data.title Titre de la notif
	 * @param {String} data.message OPTIONNEL Corps de texte de la notif
	 * @param {Number} data.timer OPTIONNEL durée d'apparition de la notif
	 */
	warningToAll(data) {
		this.notifToAll("warning", data);
	}
}

module.exports = ManageableObject;