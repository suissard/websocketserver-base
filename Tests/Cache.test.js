import { test, expect } from "vitest";
import WebSocketClient from "../Class/Client/Client";
import ClientCacheCollection from "../Class/Client/ClientCacheCollection.js";
import ClientCache from "../Class/Client/ClientCache.js";
import ClientCacheObject from "../Class/Client/ClientCacheObject.js";

test("Cache : ClientCacheCollection", async () => {
	const levelUpdated = "levelUpdated";
	const data = new ClientCacheObject({
		id: "id",
		type: "type",
		level: "level",
		visibility: "visibility",
	});
	const cache = new ClientCache({ emit: () => {} });
	const cacheCollection = new ClientCacheCollection(cache, data.type);

	cacheCollection.create(data.id, data);
	expect(cacheCollection.get(data.id)).toEqual(data);
	cacheCollection.update(data.id, { ...data, level: levelUpdated });
	expect(cacheCollection.get(data.id).level).toBe(levelUpdated);
	cacheCollection.delete(data.id, data);
	expect(cacheCollection.get(data.id)).toBe(undefined);
});

test("Cache : ClientCache", async () => {
	const levelUpdated = "levelUpdated";
	const client = new WebSocketClient()
	const cache = new ClientCache(client);
	const data = new ClientCacheObject({
		id: "id",
		type: "type",
		level: "level",
		visibility: "visibility",
	});

	//ecouter les evenements
	let eventCreateData, eventUpdateData, eventDeleteData;
	client.on("createData", (data) => {
		eventCreateData = data;
	});
	client.on("updateData", (data) => {
		eventUpdateData = data;
	});
	client.on("deleteData", (data) => {
		eventDeleteData = data;
	});

	cache.create(data.id, data.type, data);
	const cacheCollection = cache.collections[data.type];
	expect(cacheCollection.get(data.id)).toEqual(data);
	expect(eventCreateData.data).toEqual(data);
	expect(cacheCollection.size).toBe(1);

	cache.update(data.id, data.type, { ...data, level: levelUpdated });
	expect(cacheCollection.get(data.id).level).toBe(levelUpdated);
	expect(eventUpdateData.data.level).toBe(levelUpdated);
	expect(cacheCollection.size).toBe(1);

	cache.delete(data.id, data.type, data);
	expect(cacheCollection.get(data.id)).toBe(undefined);
	expect(eventDeleteData.id).toBe(data.id);
	expect(eventDeleteData.type).toBe(data.type);

	cache.create(data.id, data.type, data);
	cache.create(data.id, data.type, data);
	cache.create(data.id, data.type, data);
	cache.create("id1", data.type, { ...data, level: "private" });
	cache.create("id2", data.type, { ...data, level: "partial" });
	cache.create("id3", data.type, { ...data, level: "public" });
	expect(cacheCollection.size).toBe(4);

	cache.deleteUserData();
	expect(cacheCollection.size).toBe(2);
	expect(cacheCollection.get(data.id)).toEqual(data);
	expect(cacheCollection.get("id1")).toBe(undefined);
	expect(cacheCollection.get("id2")).toBe(undefined);
	expect(cacheCollection.get("id3")).toEqual({ ...data, level: "public" });
});
