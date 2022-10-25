import { test, expect } from "vitest";
import wait from "../Tools/wait.js";

import { getServerData } from "./serverData.js";
import WebSocketClient from "../Class/Client/Client.js";

var { server, userClientSide, userServerSide, WebSocketPort, client } = {};
const users = [];

test("Auth : Basics", async () => {
	const serverData = await getServerData();
	await wait();
	server = serverData.server;
	userClientSide = serverData.userClientSide;
	userServerSide = serverData.userServerSide;
	WebSocketPort = serverData.WebSocketPort;

	client = new WebSocketClient(undefined, WebSocketPort);
	client.saveUserData = () => {};
	client.updateData = () => {};
	client.deleteData = () => {};
	client.notifToApp = () => {};
	await wait();
}, 17000);

test("Auth : identify socket", async () => {
	// Creer x users
	const numberToCreate = 20;
	const users = [];
	for (let i = 0; i < numberToCreate; i++) {
		users.push(new WebSocketClient(undefined, WebSocketPort));
		users[i].notifToApp = () => {};
		await wait(50);
	}
	// for (let user of users ) {
	// 	user.login()
	// 	await wait(30);
	// }
	expect(server.collections.users.size).toBe(numberToCreate + 2);

	// definition des bon et mauvais utilisateur
	const goodUser = users[0];
	const badUser = users[1];

	// console.log("goodUser", goodUser.getMe());
	let test = server.collections.users.get(goodUser.getMe().id);

	goodUser.login("GoodUser", goodUser.lastData.token); //declenceh une disparition de l'utilisateeur
	badUser.login("BadUser", badUser.lastData.token);
	await wait();
	expect(goodUser.getToken() != badUser.getToken()).toBeTruthy();

	//creation dun lobby
	goodUser.connectLobby("GoodLobby");
	badUser.connectLobby("BadLobby");
	await wait();

	let goodLobby = server.collections.lobbys.get("GoodLobby");
	let badLobby = server.collections.lobbys.get("BadLobby");
	expect(
		goodLobby.getUsers().find((user) => user.getId() === goodUser.getMe().id)
	).toBeTruthy();
	expect(
		badLobby.getUsers().find((user) => user.getId() === badUser.getMe().id)
	).toBeTruthy();

	// acces depuis un autre utilisateur => refus
	goodUser.connectLobby("BadLobby");
	badUser.connectLobby("GoodLobby");
	await wait();
	goodLobby = server.collections.lobbys.get("GoodLobby");
	badLobby = server.collections.lobbys.get("BadLobby");
	expect(
		goodLobby.getUsers().find((user) => user.getId() === badUser.getMe().id)
	).toBeFalsy();
	expect(
		badLobby.getUsers().find((user) => user.getId() === goodUser.getMe().id)
	).toBeFalsy();
	expect(goodLobby.getUsers().length).toBe(1);
	expect(badLobby.getUsers().length).toBe(1);

	// acces depuis un autre utilisateur mais avec token
	goodUser.connectLobby("BadLobby", badLobby.getToken());
	badUser.connectLobby("GoodLobby", goodLobby.getToken());
	await wait();

	goodLobby = server.collections.lobbys.get("GoodLobby");
	badLobby = server.collections.lobbys.get("BadLobby");
	expect(
		goodLobby.getUsers().find((user) => user.getId() === badUser.getMe().id)
	).toBeTruthy();
	expect(
		badLobby.getUsers().find((user) => user.getId() === goodUser.getMe().id)
	).toBeTruthy();
	expect(goodLobby.getUsers().length).toBe(2);
	expect(badLobby.getUsers().length).toBe(2);

	//Tentative de reconnection au lobby avec un token invalide
	goodUser.disconnectLobby("BadLobby");
	badUser.disconnectLobby("GoodLobby");
	await wait();

	goodLobby = server.collections.lobbys.get("GoodLobby");
	badLobby = server.collections.lobbys.get("BadLobby");
	expect(goodLobby.getUsers().length).toBe(1);
	expect(badLobby.getUsers().length).toBe(1);
	expect(
		goodLobby.getUsers().find((user) => user.getId() === badUser.getMe().id)
	).toBeFalsy();
	expect(
		badLobby.getUsers().find((user) => user.getId() === goodUser.getMe().id)
	).toBeFalsy();

	goodUser.connectLobby("BadLobby", "azerty");
	badUser.connectLobby("GoodLobby", "azerty");
	await wait();
	goodLobby = server.collections.lobbys.get("GoodLobby");
	badLobby = server.collections.lobbys.get("BadLobby");
	expect(
		goodLobby.getUsers().find((user) => user.getId() === badUser.getMe().id)
	).toBeFalsy();
	expect(
		badLobby.getUsers().find((user) => user.getId() === goodUser.getMe().id)
	).toBeFalsy();
	expect(goodLobby.getUsers().length).toBe(1);
	expect(badLobby.getUsers().length).toBe(1);

	//Et si un utilisateur disparait est ce que le lobby renvoie tjrs le joueur
		// => oui



	// const goodToken = goodUser.getToken();
	// const badToken = badUser.getToken();
	// goodUser.login("goodUser", badToken);
	// // badUser.connectLobby('GoodLobby', goodLobby.getToken())
	// await wait(120);
	// expect(goodUser.getToken() == badUser.getToken()).toBeTruthy();
	// expect(goodLobby.getUsers().length).toBe(2);
	// expect(badLobby.getUsers().length).toBe(2);


		//Tentative de reconnection avec un token invalide


	//Tentative de reconection avec un token valide
	expect(goodUser.getToken() !== badUser.getToken()).toBeTruthy();
	// goodUser.connectLobby('BadLobby', badLobby.getToken())
	// badUser.connectLobby('GoodLobby', goodLobby.getToken())
	// await wait(120);
	// goodLobby = server.collections.lobbys.get('GoodLobby')
	// badLobby = server.collections.lobbys.get('BadLobby')
	// expect(goodLobby.getUsers().find(user => user.getId() === badUser.getMe().id)).toBeTruthy()
	// expect(badLobby.getUsers().find(user => user.getId() === goodUser.getMe().id)).toBeTruthy()

	// Verifier priorité de connection : socket et token
}, 10000);
