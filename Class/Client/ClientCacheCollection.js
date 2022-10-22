const ClientCacheObject = require("./ClientCacheObject.js");
/**
 * System de cache pour le Client
 */
class ClientCacheCollection extends Map {
	constructor(client, type) {
		super();
		Object.defineProperty(this, "getType", {
			enumerable: false,
			configurable: false,
			value: () => type,
		});

		Object.defineProperty(this, "getClient", {
			enumerable: false,
			configurable: false,
			value: () => client,
		});
	}

	getType() {
		throw new Error("getType must be overcharged");
	}

	getClient() {
		throw new Error("getClient must be overcharged");
	}

	create(id, value) {
		let data = new ClientCacheObject(value);
		this.set(id, data);
		this.getClient().emit("createData", { id, type: this.getType(), data });
	}

	/**
	 * Met a jour les données d'un object si elle sont d'un niveau equivalent ou meilleur niveau
	 * @param {*} id
	 * @param {*} value
	 */
	update(id, value) {
		let oldData = this.get(id);
		let data = new ClientCacheObject(value);
		if (oldData && oldData.level == "private" && data.level !== "private") return;
		if (
			oldData &&
			oldData.level == "partial" &&
			data.level !== "private" &&
			data.level !== "public"
		)
			return;
		this.set(id, data);
		this.getClient().emit("updateData", { id, type: this.getType(), data });
	}

	delete(id) {
		super.delete(id);
		this.getClient().emit("deleteData", { id, type: this.getType() });
	}
}

module.exports = ClientCacheCollection