const Server = require("./Class/Server");
const Client = require("./Class/Client");
exports.Lobby = require("./Class/Lobby");
exports.LobbysManager = require("./Class/LobbysManager");
exports.ManageableObject = require("./Class/ManageableObject");
exports.Message = require("./Class/Message");
exports.MessagesManager = require("./Class/MessagesManager");
exports.ObjectsManager = require("./Class/ObjectsManager");
exports.User = require("./Class/User");
exports.UsersManager = require("./Class/UsersManager");

exports.launchApp = function (
	WebSocketPort = 3000,
	WSoptions = { cors: { origin: "*" } },
) {
	// Instancie un serveur webSocket et gere l'evenementiel des différents sockets associés aux User
	return new Server(WebSocketPort, WSoptions);
};

exports.launchClient = function (
	domain,port,protocole,handlers,token
) {
	// Instancie un client webSocket et gere l'evenementiel des différents sockets associés aux User
	return new Client(domain,port,protocole,handlers,token);
};

exports.Server = Server;
exports.Client = Client;
