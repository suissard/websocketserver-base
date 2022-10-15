import ClientCacheObject from "./ClientCacheObject.js";
/**
 * System de cache pour le Client
 */
export default class ClientCacheCollection extends Map {
	constructor(clientCache, type) {
		super();
		Object.defineProperty(this, "getType", {
			enumerable: false,
			configurable: false,
			value: () => type,
		});

		Object.defineProperty(this, "getClientCache", {
			enumerable: false,
			configurable: false,
			value: () => clientCache,
		});
	}

	getType() {
		throw new Error("getType must be overcharged");
	}

	getClientCache() {
		throw new Error("getClientCache must be overcharged");
	}

	create(id, value) {
		let data = new ClientCacheObject(value);
		super.set(id, data);
		this.getClientCache().emit("createData", { id, type: this.getType(), data });
	}

	update(id, value) {
		let data = new ClientCacheObject(value);
		super.set(id, data);
		this.getClientCache().emit("updateData", { id, type: this.getType(), data });
	}

	delete(id) {
		super.delete(id);
		this.getClientCache().emit("deleteData", { id, type: this.getType() });
	}
}
