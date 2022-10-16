const Server = require("../Class/Server.js");

const launchApp = function (
	WebSocketPort = 3000,
	WSoptions = { cors: { origin: "*" } },
) {
	// Instancie un serveur webSocket et gere l'evenementiel des différents sockets associés aux User
	return new Server(WebSocketPort, WSoptions);
};

launchApp();
