const uuidv4 = require("uuid").v4;
const User = require("./User.js");
const ManageableObject = require("./ManageableObject.js");

/**
 * Permet de gerer une collection d'object en servant d'intermediaire, pour limiter es acces en fonction des droits utilisateurs
 * @param {Array} adminsId tableau des id des différents administrateurs (fullAccess)
 * @param {Array} permissions tableau des id des différents administrateurs (fullAccess)
 * @param {Class} constructor Class permettant de construire les objects
 * @returns {ObjectsManager}
 */
class ObjectsManager extends Map {
	constructor(server, adminsId = [], permissions, constructor = ManageableObject) {
		if (!server) throw new Error("A server must be specified");
		super();
		this.setConstructor(constructor);

		this.adminsId = adminsId;
		this.permissions; // TODO moche et correspond aps aua standarad getter / setter
		this.setPermissions(permissions);
		this.setServer(server);
	}
	/**
	 * Renvoie le constructor des object du manager
	 * @returns {ManageableObject}
	 */
	getConstructor() {
		throw new Error("This function must be overcharge");
	}

	getIdCalculator(incrementedId = 0) {
		if (!this.has(this.size + incrementedId)) return this.size + incrementedId;
		return this.getIdCalculator(incrementedId + 1);
	}

	/**
	 * Définit le constructor a renvoier via getConstructor
	 * @param {Class} constructor
	 */
	setConstructor(constructor = ManageableObject) {
		return this.setProperty("getConstructor", constructor);
	}

	setProperty(propertyName, value) {
		Object.defineProperty(this, propertyName, {
			enumerable: false,
			configurable: true,
			value: () => value,
		});
	}

	setServer(server) {
		this.setProperty("getServer", server);
	}

	/**
	 * Récuperer les permissions disponibles en fonction des droits utilisateurs
	 * @returns {Array}
	 */
	getPermissions() {
		throw new Error("This function must be overcharge");
	}
	setPermissions(
		permissions = {
			owner: [
				"setId",
				"setOwner",
				"setToken",
				"setVisibility",
				"addUser",
				"addUsers",
				"deleteUser",
				"deleteUsers",
				"update",
			],
			token: [
				"setVisibility",
				"addUser",
				"addUsers",
				"deleteUser",
				"deleteUsers",
				"update",
			],
			users: ["addUser", "addUsers"],
		}
	) {
		this.permissions = permissions;
	}
	/**
	 * Générer un token d'authentication
	 * @returns {String}
	 */
	generateToken() {
		return `${uuidv4()}-${uuidv4()}`;
	}

	/**
	 * Créer une nouvelle entrée
	 * @param {User} user Utilisateur qui seras le proprietaire de l'objet
	 * @param {Object} data Donnée de l'objet
	 * @param {String} token Token permettant d'acceder a l'objet meme si visibility = false
	 * @param {Boolean} visibility Est ce qeu l'object est visible par tous
	 * @param {Number} id identifiant system de l'objet
	 * @returns {ManageableObject}
	 */
	create(user, data, token, visibility = false, id, createdAt, updatedAt) {
		if (!user) throw Error(`A user must be specified`);
		const constructor = this.getConstructor();
		if (id === undefined) id = this.getIdCalculator();
		if (this.has(id)) throw Error(`${constructor.name} "${id}" already exist`);
		const newObject = new constructor(
			id,
			user,
			token || this.generateToken(),
			data,
			visibility,
			undefined,
			createdAt,
			updatedAt,
			this
		);
		newObject.created(id, user, token, data, visibility, createdAt, updatedAt, this);

		this.set(newObject.getId(), newObject);
		return newObject;
	}

	/**
	 * Mettre a jour les données d'un objet
	 * @param {Number} id Identifiant de l'objet cible
	 * @param {User} user Utilisateur effectuant la requete
	 * @param {Object} data donnée à modifier
	 * @returns {ManageableObject}
	 */
	update(id, user, data) {
		if (!id || !user) throw Error(`An ID and a user must be specified`);
		const object = this.get(id);
		if (!object) throw Error(`${constructor.name} "${id}" doesn't exist`);
		if (!object.userIsOwner(user.getId()) || this.userIsAdmin(user.getId()))
			throw new Error(`${user.username} is not the owner`);
		object.update(data);

		return object;
	}

	/**
	 * Supprimer un objet du manager
	 * @param {Number} id Identifiant de l'objet cible
	 * @param {User} user Utilisateur effectuant la requete
	 * @returns {ManageableObject}
	 */

	delete(id, user) {
		if (id === undefined || !user) throw Error(`An ID and a user must be specified`);
		const object = super.get(id);
		if (!object.userIsOwner(user.getId())) throw new Error(`${user.username} is not the owner`);
		object.beforeDeleted();
		super.delete(id);
		object.deleted();
	}

	/**
	 * Effectuer une action sur l'objet
	 * @param {String} action
	 * @param {Array} args
	 */
	useAction( id, user, token, action, args,) {
		const permissions = this.getPermissions(id, user, token);
		if (!permissions.includes(action)) throw new Error(`Action "${action}" is not allowed`);
		const object = this.get(id);
		object[action](...args);
	}

	/**
	 * Recuperer al liste des permissions autorisé a un utilisateur et le token fournit
	 * @param {String} id
	 * @param {User} user
	 * @param {String} token
	 * @returns {Object}
	 */
	getPermissions(id, user, token) {
		const object = this.checkUserAccess(id, user.getId(), token);
		if (!object) return [];

		let result = [];

		const pushIfUnique = (vals) => {
			for (let i in vals) if (!result.includes(vals[i])) result.push(vals[i]);
		};

		if (object.userIsOwner(user.getId())) pushIfUnique(this.permissions.owner);
		if (object.tokenGrantAccess(token)) pushIfUnique(this.permissions.token);
		if (object.userIsPresent(user.getId())) pushIfUnique(this.permissions.users);
		return result;
	}

	/**
	 * Récuperer les info, relativement au niveau d'autorisation de l'utilisateur fournit
	 * @param {String} id
	 * @param {User} user
	 * @param {String} token
	 * @returns {ManageableObject}
	 */
	getInfo(id, user, token) {
		const object = this.get(id);
		if (!object) throw new Error(`${this.getConstructor().name} ${id} don't exist`);
		var data;
		if (
			object.userIsOwner(user?.getId()) ||
			object.tokenGrantAccess(token) ||
			this.userIsAdmin(user?.getId())
		)
			data = object.getPrivateInfo();
		else if (object.userIsPresent(user.getId())) data = object.getPartialInfo();
		else if (object.getVisibility()) data = object.getPublicInfo();
		if (data) data.permissions = this.getPermissions(id, user, token);
		return data;
	}

	getInfos(user, token) {
		let result = [];
		let data = this.findAll(undefined, user.getId(), token);
		for (let [id, obj] of this) {
			let info = this.getInfo(id, user, token);

			if (info) result.push(info);
		}
		return result;
	}
	/**
	 * Verifier l'accessibilité d'un object : utilisateur admin, object visible a tous, utilisateur est proprietaire, token correct. Renvoie erreur si incorrect
	 * @param {Number} id Identifiant de l'objet cible
	 * @param {User} user Utilisateur effectuant la requete
	 * @param {String} token Token pour acceder a l'objet
	 * @returns {ManageableObject}
	 */
	checkUserAccess(id, userId, token) {
		if (id === undefined || !userId) throw Error(`An ID and a user must be specified`);
		const object = this.get(id);
		let constructor = this.getConstructor();
		if (!object) {
			throw new Error(`${constructor.name} "${id}" doesn't exist`);
		} else if (!this.userIsAdmin(userId) && !object.checkUserAccess(userId, token))
			throw new Error(
				`User ${userId} don't have access to <${constructor.name} ${id}>`
			);
		return object;
	}

	/**
	 * Verifie si utilisateur est un administrateur de ce manager
	 * @param {User} user
	 * @returns {Boolean}
	 */
	userIsAdmin(userId) {
		return this.adminsId.includes(userId);
	}

	/**
	 * Effectuer une recherche dans le manager et renvoie la prermier object remplissant les conditions
	 * @param {User} user Utilisateur effectuant la requete
	 * @param {String} token Token pour tester l'acces d'un object si visibility = false
	 * @param {Function} func Function pour valider ou non un résultat
	 * @returns {ManageableObject}
	 */
	find(func, userId, token) {
		if (!userId && !token) return;
		for (let [id, obj] of this) {
			if (func(obj))
				if (obj.checkUserAccess(userId, token) || this.userIsAdmin(userId)) return obj;
		}
	}

	/**
	 * Effectuer une recherche dans le manager et renvoie tout les objects remplissant les conditions
	 * @param {User} user Utilisateur effectuant la requete
	 * @param {String} token Token pour tester l'acces d'un object si visibility = false
	 * @param {Function} func Function pour valider ou non un résultat
	 * @returns {Array}
	 */
	findAll(func = () => true, userId, token) {
		const result = [];
		for (let [id, obj] of this) {
			if (func(obj))
				if (obj.checkUserAccess(userId, token) || this.userIsAdmin(userId)) result.push(obj);
		}
		return result;
	}
}

module.exports = ObjectsManager;
