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
	await wait();

	// console.log("client", client.socket);
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
		lobby = { id },
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
    const lobbyServer = server.collections.lobbys.get(id)
    user = server.collections.users.findUserWithSocket(client.socket)
    expect(lobbyServer.getOwner()).toBe(user)
    expect(lobbyServer.getUsers().length).toBe(1)
    expect(user.lobbys.size).toBe(1)

	client.disconnectLobby(id, token);
	await wait();

	// client.sendMessage(lobby, content, token);
	// await wait();

	// client.receivedMessage(lobby, message, token);
	// await wait();

	// client.viewedMessage(lobby, message, token);
	// await wait();

	// client.typingMessage(lobby, token);
	// await wait();

	// client.getData(id, type);
	// await wait();

	// client.getAllData(token);
	// await wait();
});

test("Client : Handlers", async () => {
	//tester les differents handlers
	// client.handleLogin;
	// client.handleLogout;
	// client.handleDisconnect;
	// client.handleConnectLobby;
	// client.handleDisconnectLobby;
	// client.handleSendMessage;
	// client.handleReceivedMessage;
	// client.handleViewedMessage;
	// client.handleTypingMessage;
	// client.handleGetData;
	// client.handleGetAllData;
	// client.handleUpdateData;
});
