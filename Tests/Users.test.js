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

	const reservedProperty = "socket";
	userServerSide.update({ [reservedProperty]: "wrongValue" }).getPrivateInfo();
	expect(userServerSide.socket != "wrongValue").toBeTruthy();
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
		level: "private",
		owner: userServerSide.getOwner().getPublicInfo(),
		token: userServerSide.getToken(),
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s",
		users: [],
		createdAt: userServerSide.getCreatedAt(),
		updatedAt: userServerSide.getUpdatedAt(),
		data: {
			username: userServerSide.username,
			lobbys: [],
		},
	});

	expect(userServerSide.getPartialInfo()).toEqual({
		id: userServerSide.getId(),
		level: "partial",
		owner: userServerSide.getOwner().getPublicInfo(),
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s", 
		users: [],
		createdAt: userServerSide.getCreatedAt(),
		updatedAt: userServerSide.getUpdatedAt(),
		data: {
			username: userServerSide.username,
		},
	});

	expect(userServerSide.getPublicInfo()).toEqual({ 
		data: { username: userServerSide.username },
		id: userServerSide.getId(),
		level: "public",
		visibility: userServerSide.getVisibility(),
		type: userServerSide.constructor.name.toLowerCase() + "s",
	});
});

test("User : connection state", async () => {
	expect(userServerSide.isConnect()).toBeTruthy();
	userClientSide.socket.disconnect();
	await wait();
	expect(userServerSide.isConnect()).toBeFalsy();
});
