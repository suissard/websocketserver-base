const Server = require("./Class/Server");
const launchWebApp = require("./index.js");

exports.launchWebApp = launchWebApp;
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

/**
 * Launch Vue web Application based on dist file
 * @param {*} port
 */
exports.launchWebApp = function (port = 80) {
	const express = require("express");
	const app = express();
	app.use(express.static(__dirname + "/WebSite"));

	app.all("*", (req, res) => {
		res.sendFile(__dirname + "/WebSite/index.html");
		app.use("/static", express.static("static"));
	});

	app.listen(port, () => {
		console.log("🌐 ServerWeb en ligne au port " + port);
	});
	return app;
};
exports.Server = Server;
