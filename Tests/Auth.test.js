import { test, expect, vi, afterAll, beforeAll } from "vitest";
import wait from "../Tools/wait.js";
import axios from "axios";

import { getServerData } from "./serverData.js";
import WebSocketClient from "../Class/Client/Client.js";

// Mock the axios library
vi.mock("axios");

let server;
let WebSocketPort;
const clients = []; // Keep track of clients to disconnect them later

beforeAll(async () => {
	const serverData = await getServerData();
	server = serverData.server;
	WebSocketPort = serverData.WebSocketPort;
	// Close the initial client from getServerData as it's not needed for these tests
	serverData.userClientSide.socket.disconnect();
}, 20000); // Increased timeout for setup

afterAll(() => {
	// Disconnect all clients
	clients.forEach((client) => {
		if (client.socket) {
			client.socket.disconnect();
		}
	});
	// Close the server
	server.close();
});

test("Auth : Successful Login via Strapi", async () => {
	// 1. Mock a successful API response
	const strapiResponse = {
		jwt: "fake-jwt-token",
		user: {
			id: 1,
			username: "strapi_user",
			email: "user@strapi.com",
		},
	};
	axios.post.mockResolvedValue({ data: strapiResponse });

	// 2. Create a client and attempt to log in
	const client = new WebSocketClient(undefined, WebSocketPort);
	clients.push(client); // Track client for cleanup
	client.notifToApp = () => {};
	await wait(100); // Wait for connection

	const credentials = { identifier: "strapi_user", password: "password123" };
	client.login(credentials);
	await wait(100); // Wait for server processing

	// 3. Assertions
	expect(axios.post).toHaveBeenCalledWith(
		"http://localhost:1337/api/auth/local",
		credentials
	);

	const serverUsers = Array.from(server.collections.users.values());
	const loggedInUser = serverUsers.find(
		(user) => user.strapiId === strapiResponse.user.id
	);

	expect(loggedInUser).toBeDefined();
	expect(loggedInUser.username).toBe(strapiResponse.user.username);
	expect(loggedInUser.getToken()).toBe(strapiResponse.jwt);
});

test("Auth : Failed Login via Strapi", async () => {
	// 1. Mock a failed API response
	const errorResponse = {
		response: {
			data: {
				error: {
					status: 401,
					name: "UnauthorizedError",
					message: "Invalid identifier or password",
				},
			},
		},
	};
	axios.post.mockRejectedValue(errorResponse);

	// 2. Create a client and set up an error listener
	const client = new WebSocketClient(undefined, WebSocketPort);
	clients.push(client); // Track client for cleanup
	client.notifToApp = () => {};
	await wait(100);

	const loginErrorPromise = new Promise((resolve) => {
		client.socket.on("login_error", (error) => {
			resolve(error);
		});
	});

	// 3. Attempt to log in with wrong credentials
	const credentials = { identifier: "wrong_user", password: "wrong_password" };
	client.login(credentials);

	// 4. Assertions
	const receivedError = await loginErrorPromise;
	expect(receivedError).toBeDefined();
	expect(receivedError.message).toContain("Invalid identifier or password");

	const serverUsers = Array.from(server.collections.users.values());
	const loggedInUser = serverUsers.find(
		(user) => user.username === credentials.identifier
	);
	expect(loggedInUser).toBeUndefined();
});
