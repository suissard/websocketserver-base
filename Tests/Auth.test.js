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

	console.log("goodUser", goodUser.getMe());
	let test = server.collections.users.get(goodUser.getMe().id)

	goodUser.login('GoodUser', goodUser.lastData.token) //declenceh une disparition de l'utilisateeur
	badUser.login('BadUser', badUser.lastData.token)
	await wait();
	test = server.collections.users.get(goodUser.lastData.id)

	//creation dun lobby
	goodUser.connectLobby('GoodLobby')
	badUser.connectLobby('BadLobby')
	await wait();

	//acces depuis un autre utilisateur
	// goodUser.connectLobby('BadLobby')
	// badUser.connectLobby('GoodLobby')
	await wait(120);
	console.log(server.collections.lobbys.get('GoodLobby').getUsers())
	console.log(server.collections.lobbys.get('BadLobby').getUsers())
	goodUser.lastData
	//Acces depuis le owner

	//Tentative de reconnection avec un token invalide
	
	//Tentative de reconection avec un token valide


	// Verifier priorité de connection : socket et token

}, 10000);
