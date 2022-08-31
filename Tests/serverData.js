import wait from "../Tools/wait.js";
import ObjectsManager from "../Class/ObjectsManager.js";
import User from "../Class/User.js";

const Server = require("../Class/Server");
const WebSocketClient = require("./WebSocketClient.js");
const MQTT = require("mqtt");

/**
 *
 * @param {ObjectsManager} managerConstructor
 * @param {Number} numberOfObject
 * @param {Object} data
 * @returns
 */
const createManager = function (
	managerConstructor = ObjectsManager,
	numberOfObject = 1000,
	data = {}
) {
	const { ownerUser, partialUser, publicUser, adminUser } = {
		ownerUser: new User(1, {}, "123456789", { username: "ownerUserName" }),
		partialUser: new User(2, {}, "123456789", { username: "partialUserName" }),
		publicUser: new User(3, {}, "123456789", { username: "publicUserName" }),
		adminUser: new User(99, {}, "987654321", { username: "adminUserName" }),
	};
	const manager = new managerConstructor([adminUser.getId()]);
	const token = manager.generateToken();

	for (let i = 0; i < numberOfObject; i++) manager.create(ownerUser, data, token);

	for (let [id, obj] of manager) obj.addUser(partialUser);

	console.log(
		`Création d'un manager de ${manager.size} ${manager.getConstructor().name}`
	);

	return { manager, adminUser, ownerUser, partialUser, publicUser, token };
};

const getServerData = async function () {
	const username = "admin",
		password = "admin",
		url = "mqtt://192.168.1.38:1883",
		clientId = "mqtt123456789",
		WebSocketPort = Math.ceil(Math.random() * 10000),
		WSoptions = { cors: { origin: "*" } };

	//lancement de la liaison avec MQTT
	const client = MQTT.connect(url, {
		clientId,
		username,
		password,
		clean: true,
		connectTimeout: 4000,
		reconnectPeriod: 1000,
	});

	const server = new Server(WebSocketPort, WSoptions, client, {});
	const userClientSide = new WebSocketClient(undefined, WebSocketPort);
	const usernameServerSide = "testUser";

	await userClientSide.connectSocket();
	userClientSide.socket.emit("Login", { username: usernameServerSide });
	await wait(400);
	const userServerSide = server.users.get(userClientSide.lastData.getId);

	return { server, userClientSide, userServerSide };
};

module.exports = { getServerData, createManager };
