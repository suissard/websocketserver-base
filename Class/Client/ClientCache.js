import { EventEmitter } from "node:events";
import ClientCacheCollection from "./ClientCacheCollection.js";
/**
 * System de cache pour le Client basé sur des evenements
 * EVENTS : createData, updateData, deleteData
 */
export default class ClientCache extends EventEmitter {
	constructor(client) {
		super();
		Object.defineProperty(this, "getClient", {
			enumerable: false,
			configurable: false,
			value: () => client,
		});
		this.collections = {};
	}

	getClient() {
		throw new Error("getClient must be overcharged");
	}
	
	create(id, type, data) {
		if (!this.collections[type])
			this.collections[type] = new ClientCacheCollection(this.getClient(), type);
		return this.collections[type].create(id, data);
	}
	update(id, type, data) {
		if (!this.collections[type])
			this.collections[type] = new ClientCacheCollection(this.getClient(), type);
		return this.collections[type].update(id, data);
	}
	delete(id, type, data) {
		if (!this.collections[type])
			this.collections[type] = new ClientCacheCollection(this.getClient(), type);
		return this.collections[type].delete(id, data);
	}

	/**
	 * Delete private and partial data
	 */
	deleteUserData() {
		for (let type in this.collections) {
			let destroyableId = [];
			this.collections[type].forEach((data, id) => {
				if (data.level === "private" || data.level === "partial") destroyableId.push(id);
			});
			destroyableId.forEach((id) => this.collections[type].delete(id));
		}
	}
}
