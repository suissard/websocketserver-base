const wait = require("../Tools/wait.js");
const ObjectsManager = require("../Class/ObjectsManager.js");
const User = require("../Class/User.js");

const Server = require("../Class/Server");
const WebSocketClient = require("./WebSocketClientForTesting.js");

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
	const manager = new managerConstructor(true,[adminUser.getId()]);
	const token = manager.generateToken();

	for (let i = 0; i < numberOfObject; i++) manager.create(ownerUser, data, token);

	for (let [id, obj] of manager) obj.addUser(partialUser);

	console.log(
		`Création d'un manager de ${manager.size} ${manager.getConstructor().name}`
	);

	if (!manager || !adminUser || !ownerUser || !partialUser || !publicUser || !token)
		throw new Error("Manager a bugué");

	return { manager, adminUser, ownerUser, partialUser, publicUser, token };
};

const getServerData = async function (handlers) {
	const WebSocketPort = Math.ceil(Math.random() * 10000),
		WSoptions = { cors: { origin: "*" } };

	const server = new Server(WebSocketPort, WSoptions, handlers);
	const userClientSide = new WebSocketClient(undefined, WebSocketPort);
	const usernameServerSide = "testUser";

	await userClientSide.connectSocket();
	userClientSide.socket.emit("login", { username: usernameServerSide });
	await wait(400);
	userClientSide.id = userClientSide.lastData.id;
	const userServerSide = server.collections.users.get(userClientSide.lastData.id);

	if (
		(!server ||
			!userClientSide ||
			!userServerSide ||
			userClientSide.id !== userServerSide.getId() ||
			userClientSide.socket.id !== userServerSide.socket.id)
	)
		throw new Error("ServerData a bugué");

	return { server, userClientSide, userServerSide, WebSocketPort };
};

module.exports = { getServerData, createManager };
