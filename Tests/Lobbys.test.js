import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData, createManager } from "./serverData.js";
import LobbysManager from "../Class/LobbysManager.js";
import Lobby from "../Class/Lobby.js";
import User from "../Class/User.js";

var { server, userClientSide, userServerSide } = {};

const sizeLimit = 5,
	id = "LobbyTestTitle",
	description = "This is the lobby description";

const data = { id };

const { manager, adminUser, ownerUser, partialUser, publicUser, token } = createManager(
	LobbysManager,
	1000,
	{
		sizeLimit,
		description,
	}
);

var lobby = {};

test("Lobbys : Start", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	server.lobbys = manager;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;
	console.log("userServerSide", userServerSide.username);
	adminUser.socket = userServerSide.socket;
	ownerUser.socket = userServerSide.socket;
	partialUser.socket = userServerSide.socket;
	publicUser.socket = userServerSide.socket;
});

test("Lobbys : Creer lobbyManager et lobby", async () => {
	lobby = new Lobby(0, userServerSide, "lobbyToken");
	lobby = manager.create(
		userServerSide,
		{ description, sizeLimit },
		undefined,
		undefined,
		id
	);
	expect(lobby.sizeLimit).toBe(sizeLimit);
	expect(lobby.getId()).toBe(id);
	expect(lobby.description).toBe(description);
	expect(lobby.getOwner()).toBe(userServerSide);
	expect(lobby.getToken()).toMatch(
		/.{8}\-.{4}\-.{4}\-.{4}\-.{12}\-.{8}\-.{4}\-.{4}\-.{4}\-.{12}/
	);
	expect(lobby.getUsers()).toEqual([]);
	expect(lobby.messages).toBeInstanceOf(Map);
});

test("Lobbys : fonctions server vers lobbyManager", async () => {
	// "ConnectLobby"
	lobby = server.lobbys.get(id);
	lobby.setOwner(ownerUser);
	expect(() => {
		server.handleConnectLobby(publicUser, data);
	}).toThrowError(`User ${publicUser.username} don't have access to <Lobby ${id}>`);
	expect(() => {
		server.handleConnectLobby(partialUser, data);
	}).toThrowError(`User ${partialUser.username} don't have access to <Lobby ${id}>`);
	lobby.connect(partialUser);

	server.handleConnectLobby(ownerUser, data);
	server.handleConnectLobby(adminUser, data);
	server.handleConnectLobby(userServerSide, { ...data, token: lobby.getToken() });

	server.handleConnectLobby(new User("user1", true, "ezrzer", { username: "user1" }), {
		...data,
		token: lobby.getToken(),
	});
	expect(() => {
		server.handleConnectLobby(new User("user2", true, "ezrzer", { username: "user2" }), {
			...data,
			token: lobby.getToken(),
		});
	}).toThrowError(`Lobby ${id} is full`);

	await wait();
	expect(userClientSide.lastEvent).toBe("ConnectLobby");
	expect(userClientSide.lastData.id).toBe(id);
	expect(lobby.userIsPresent(partialUser)).toBeTruthy();
	expect(lobby.userIsPresent(ownerUser)).toBeTruthy();
	expect(lobby.userIsPresent(adminUser)).toBeTruthy();
	expect(lobby.userIsPresent(userServerSide)).toBeTruthy();

	// "DisconnectLobby",
	server.handleDisconnectLobby(partialUser, data);
	await wait();
	expect(userClientSide.lastEvent).toBe("DisconnectLobby");
	expect(userClientSide.lastData.id).toBe(id);
	expect(ownerUser.lobbys.has(id)).toBeTruthy();
	expect(partialUser.lobbys.has(id)).toBeFalsy();
});
