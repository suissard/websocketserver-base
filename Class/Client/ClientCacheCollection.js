/**
 * System de cache pour le Client
 */
export default class ClientCacheCollection extends Map {
	constructor(clientCache, type) {
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

	// set(id, value) {
	// 	super.set(id, value);
	// 	this.getClientCache().emit("setData", { id, type: this.getType(), value });
	// }

	create(id, value) {
		super.set(id, value);
		this.getClientCache().emit("createData", { id, type: this.getType(), value });
	}

	uddate(id, value) {
		super.set(id, value);
		this.getClientCache().emit("updateData", { id, type: this.getType(), value });
	}

	delete(id) {
		super.delete(id);
		this.getClientCache().emit("deleteData", { id, type: this.getType() });
	}
}
