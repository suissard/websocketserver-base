import { EventEmitter } from 'node:events';
import ClientCacheCollection from './ClientCacheCollection.js'
/**
 * System de cache pour le Client
 */
export default class ClientCache extends EventEmitter {
	create(id, type, data) {
		if (!this[type]) this[type] = new ClientCacheCollection(this, type);
		return this[type].create(id, data);
	}
	update(id, type, data) {
		if (!this[type]) this[type] = new ClientCacheCollection(this, type);
		return this[type].update(id, data);
	}
	delete(id, type, data) {
		if (!this[type]) this[type] = new ClientCacheCollection(this, type);
		return this[type].delete(id, data);
	}
}
