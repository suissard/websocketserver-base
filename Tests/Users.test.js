// TODO pas très carré
import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
import Lobby from "../Class/Lobby.js";
var { server, userClientSide, userServerSide } = {};

test("User : Basics", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;

	expect(userServerSide.username).toBeTypeOf("string");
	expect(userServerSide.getId()).toMatch(/.{8}\-.{4}\-.{4}\-.{4}\-.{12}/);
	expect(userServerSide.getOwner().username).toBe(userServerSide.username);
	expect(userServerSide.getToken()).toMatch(
		/.{8}\-.{4}\-.{4}\-.{4}\-.{12}\-.{8}\-.{4}\-.{4}\-.{4}\-.{12}/
	);
	expect(userServerSide.getUsers()).toEqual([]);

	const lobbys = [
		new Lobby(0, userServerSide, 123456798, 12),
		new Lobby(1, userServerSide, 123456798, 12),
		new Lobby(2, userServerSide, 123456798, 12),
	];

	expect(userServerSide.setLobbys(lobbys).size).toBe(3);

	const reservedProperty = 'socket'
	expect(()=>userServerSide.update({[reservedProperty]:"wrongValue"})).toThrowError(`"${reservedProperty}" is reserved in ${userServerSide.constructor.name}`)

});

test("User : Infos", async () => {
	var eventData = {
		title: "testSuccess",
		message: "testMessageSuccess",
		timer: 10,
		type: "success",
	};
	userServerSide.success(eventData);
	await wait();
	expect(userClientSide.lastEvent).toBe("success");
	expect(userClientSide.lastData).toEqual(eventData);

	expect(userServerSide.getPrivateInfo()).toEqual({
		id: userServerSide.getId(),
		owner: { id: userServerSide.getId(), username: userServerSide.username },
		token: userServerSide.getToken(),
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s",
		users: [],
		data: {
			createdAt: userServerSide.createdAt,
			updatedAt: userServerSide.updatedAt,
			username: userServerSide.username,
			lobbys: new Map(),
		},
	});

	expect(userServerSide.getPartialInfo()).toEqual({
		id: userServerSide.getId(),
		owner: { id: userServerSide.getId(), username: userServerSide.username },
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s",
		users: [],
		data: {
			username: userServerSide.username,
			createdAt: userServerSide.createdAt,
			updatedAt: userServerSide.updatedAt,
		},
	});

	expect(userServerSide.getPublicInfo()).toEqual({
		id: userServerSide.getId(),
		owner: { id: userServerSide.getId(), username: userServerSide.username },
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s",
		users: [],
		data: { username: userServerSide.username },
	});

	expect(userServerSide.getUserInfo()).toEqual({
		id: userServerSide.getId(),
		username: userServerSide.username,
	});
});


test("User : connection state", async () => {
	expect(userServerSide.isConnect()).toBeTruthy();
	userClientSide.socket.disconnect()
	await wait()
	expect(userServerSide.isConnect()).toBeFalsy();
});