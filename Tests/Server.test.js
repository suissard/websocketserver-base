import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
var { server, userClientSide, userServerSide } = {};

test("Server : login & logout et users", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;

	const findWithNoAutorization = server.users.find(() => {
		return true;
	});
	expect(findWithNoAutorization).toBeFalsy();
	const findWithGoodUser = server.users.find(() => {
		return true;
	}, userServerSide);
	expect(findWithGoodUser).toBe(userServerSide);

	const findWithToken = server.users.find(
		() => {
			return true;
		},
		undefined,
		userServerSide.getToken()
	);
	expect(findWithToken).toBe(userServerSide);

	await wait();

	expect(userClientSide.lastEvent).toBe("Login");
	expect(userClientSide.lastData.id).toBe(userServerSide.getPrivateInfo().id);
	expect(server.users.size).toBe(1);
	server.handleLogout(userServerSide);
	await wait();
	expect(server.users.size).toBe(0);
	userServerSide = server.users.get(userServerSide.getId());
	expect(userServerSide).toBeFalsy();
	userClientSide.socket.emit("Login", { username: userClientSide.lastData.username });
	await wait();
	userServerSide = server.users.get(userClientSide.lastData.id);
});

test("Server : HandleUpdateUser", async () => {
	const updatedUsername = "updatedUsername";
	server.handleUpdateUser(
		userServerSide,
		{ username: updatedUsername, token: userServerSide.getToken() },
		userClientSide.socket
	);
	await wait();
	expect(userServerSide.username).toBe(updatedUsername);
});

test("Server : new listerner", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;
	const handlers = {
		listener1: (x) => {
			console.log("listener1", x);
		},
		listener2: (x) => {
			console.log("listener2", x);
		},
		listener3: (x) => {
			console.log("listener3", x);
		},
	};
	// server = new Server(5000, undefined, handlers);
	userClientSide.emit("listener1", "test1");
	wait();
	expect(userServerSide.ghug).toBe();
});
