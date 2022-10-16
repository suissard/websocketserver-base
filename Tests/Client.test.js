import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
import WebSocketClient from "../Class/Client/Client.js";

var { server, userClientSide, userServerSide, WebSocketPort, client } = {};

test("Client : Basics", async () => {
	const serverData = await getServerData();
	await wait();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;
	WebSocketPort = serverData.WebSocketPort;

	client = new WebSocketClient(undefined, WebSocketPort);
	client.saveData = () => {};
	client.saveUserData = () => {};
	client.updateData = () => {};
	client.deleteData = () => {};
	client.notifToApp = () => {};
	await wait();

	expect(server.collections.users.size).toBe(2);
	client.socket.emit("logout");
	await wait();
	expect(server.collections.users.size).toBe(1);
});

test("Client : Event", async () => {
	//tester les differents evenements
	const username = "username",
		id = "lobbyId",
		token = "theToken",
		lobby = { id, token },
		content = "messageContent",
		message = { id: "messageId" },
		type = "lobbys";

	expect(server.collections.users.size).toBe(1);

	client.login(username);
	await wait();
	var user = server.collections.users.findUserWithSocket(client.socket);
	expect(user.username).toBe(username);
	expect(server.collections.users.size).toBe(2);

	client.logout();
	await wait();
	expect(user.username).toBe(username);
	expect(server.collections.users.size).toBe(1);

	client.login(username);
	await wait();
	expect(server.collections.lobbys.size).toBe(0);

	client.connectLobby(id, token);
	await wait();
	expect(server.collections.lobbys.size).toBe(1);
	let lobbyServerSide = server.collections.lobbys.get(id);
	user = server.collections.users.findUserWithSocket(client.socket);
	expect(lobbyServerSide.getOwner()).toBe(user);
	expect(lobbyServerSide.getUsers().length).toBe(1);
	expect(user.lobbys.size).toBe(1);

	client.disconnectLobby(id, token);
	await wait();
	expect(server.collections.lobbys.size).toBe(1);
	lobbyServerSide = server.collections.lobbys.get(id);
	user = server.collections.users.findUserWithSocket(client.socket);
	expect(lobbyServerSide.getOwner()).toBe(user);
	expect(lobbyServerSide.getUsers().length).toBe(0);
	expect(user.lobbys.size).toBe(0);
	client.connectLobby(id, token);
	await wait();

	client.sendMessage(lobby.id, content, token);
	await wait();
	expect(server.collections.lobbys.size).toBe(1);
	lobbyServerSide = server.collections.lobbys.get(id);
	user = server.collections.users.findUserWithSocket(client.socket);
	let messageServerSide = lobbyServerSide.messages.get(0);
	expect(lobbyServerSide.messages.size).toBe(1);
	expect(messageServerSide.content).toBe(content);
	expect(messageServerSide.distributed[0]).toBe(user.getId());

	client.receivedMessage(lobby.id, 0, token);
	await wait();
	messageServerSide = lobbyServerSide.messages.get(0);
	expect(messageServerSide.received[0]).toBe(user.getId());
	expect(messageServerSide.distributed[0]).toBe(user.getId());

	client.viewedMessage(lobby.id, 0, token);
	await wait();
	messageServerSide = lobbyServerSide.messages.get(0);
	expect(client.lastEvent).toBe("viewed_message");
	expect(messageServerSide.viewed[0]).toBe(user.getId());

	client.typingMessage(lobby.id, token);
	await wait();
	expect(client.lastEvent).toBe("typing_message");

	client.getData(id, type);
	await wait();
	expect(client.lastEvent).toBe("get_data");

	client.getAllData(token);
	await wait();
	expect(client.lastEvent).toBe("get_all_data");
});


//tester les differents handlers
test("Client : Handlers", async () => {
	const lobbyId = "lobbyId", lobbyToken = "lobbyToken"
	const content = "messageContent"

	client.connectLobby(lobbyId, lobbyToken);// client.handleConnectLobby;
	await wait();
	let userData = client.getMe()
	expect(userData.data.lobbys[0]).toBe(lobbyId);
	expect(client.cache.collections.lobbys.get(lobbyId).level).toBe("private");
	expect(client.cache.collections.lobbys.get(lobbyId).id).toBe(lobbyId);

	client.disconnectLobby(lobbyId, lobbyToken);// client.handleDisconnectLobby;
	await wait();
	expect(userData.data.lobbys.length).toBe(0);
	expect(client.cache.collections.lobbys.get(lobbyId).level).toBe("public");
	
	
	client.sendMessage(lobbyId, content);
	client.receivedMessage(lobbyId, 0);
	client.viewedMessage(lobbyId, 0);
	client.typingMessage(lobbyId, 0);
	// client.handleViewedMessage;
	// client.handleTypingMessage;
	// client.handleGetData;
	// client.handleGetAllData;
	// client.handleUpdateData;
});
