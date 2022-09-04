import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
var { server, userClientSide, userServerSide } = {};

test("Server : new listerner", async () => {
	var listener1Data = false;
	var listener1User = false;
	var listener1Socket = false;
	const data1 = "data1";

	const handlers = {
		listener1: function (authUser, socket, data) {
			console.log("authUser", authUser);
			listener1User = authUser;
			listener1Socket = socket;
			listener1Data = data;
		},
	};

	const serverData = await getServerData(handlers);
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;

	userClientSide.emit("listener1", data1);

	await wait();

	// expect(listener1User).toBe(false);
	// expect(listener1Socket).toBe(userClientSide.socket.id);
	expect(listener1Data).toBe(data1);
	console.log("username", userServerSide.username);
	// console.log("users", server.users);
	console.log(
		"user",
		server.users.find((user) => userServerSide.username == user.username, userServerSide).username);

	console.log(
		"userFindWithToken",
		server.users.findUserWithSocket(listener1Socket).username
	);
});