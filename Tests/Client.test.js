import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
import WebSocketClient from "../Class/Client/Client.js";

var { server, userClientSide, userServerSide, WebSocketPort } = {};

test("Client : Basics", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;
	WebSocketPort = serverData.WebSocketPort;
	const client = new WebSocketClient(undefined, WebSocketPort);
	console.log("client", client.url, server.url);

    await wait()


	// console.log("client", client.socket);
	console.log("server.collections.users", server.collections.users.size);
	expect(server.collections.users.size).toBe(2);
});
