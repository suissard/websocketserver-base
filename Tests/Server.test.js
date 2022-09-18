import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
var { server, userClientSide, userServerSide } = {};

test("Server : login & logout et users", async () => {
	const serverData = await getServerData();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;

	const findWithNoAutorization = server.collections.users.find(() => {
		return true;
	});
	expect(findWithNoAutorization).toBeFalsy();
	const findWithGoodUser = server.collections.users.find(() => {
		return true;
	}, userServerSide);
	expect(findWithGoodUser).toBe(userServerSide);

	const findWithToken = server.collections.users.find(
		() => {
			return true;
		},
		undefined,
		userServerSide.getToken()
	);
	expect(findWithToken).toBe(userServerSide);

	await wait();

	expect(userClientSide.lastEvent).toBe("login");
	expect(userClientSide.lastData.id).toBe(userServerSide.getPrivateInfo().id);
	expect(server.collections.users.size).toBe(1);
	server.handleLogout(userServerSide);
	await wait();
	expect(server.collections.users.size).toBe(0);
	userServerSide = server.collections.users.get(userServerSide.getId());
	expect(userServerSide).toBeFalsy();
	userClientSide.socket.emit("login", { username: userClientSide.lastData.username });
	await wait();
	userServerSide = server.collections.users.get(userClientSide.lastData.id);
});

test("Server : HandleUpdateUser", async () => {
	const updatedUsername = "updatedUsername";
	server.handleUpdateData(userServerSide, userClientSide.socket, {
		username: updatedUsername,
		token: userServerSide.getToken(),
		type: "users",
		id: userServerSide.getId(),
	});
	await wait();
	expect(userServerSide.username).toBe(updatedUsername);
});

test("Server : new listener", async () => {
	var listener1Data = false;
	var listener1User = false;
	var listener1Socket = false;
	const data1 = "data1";

	const handlers = {
		listener1: function (authUser, socket, data) {
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

	expect(listener1User).toBe(userServerSide);
	expect(listener1Socket.id).toBe(userClientSide.socket.id);
	expect(listener1Socket).toBe(userServerSide.socket);
	expect(listener1Data).toBe(data1);
});
