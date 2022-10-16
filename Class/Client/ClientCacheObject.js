/**
 * Class pour recuperer les object dan le cache. Verifie les propriétés critiques
 */
export default class ClientCacheObject {
	constructor(value) {
		let { id, level, owner, token, visibility, type, users, createdAt, updatedAt, data } =
			value;
		if (id === undefined || !type || !level || visibility === undefined)
			throw new Error(
				`${id === undefined ? "" : "'id' "}${type ? "" : "'type' "}${level ? "" : "'level' "}${
					visibility !== undefined ? "" : "'visibility' "
				}is required`
			);

		this.id = id;
		this.type = type;
		this.level = level;
		this.visibility = visibility;

		this.owner = owner;
		this.token = token;
		this.users = users;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.data = data || {};
	}
}
