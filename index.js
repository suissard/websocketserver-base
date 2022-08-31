const Server = require("./WebSocket/Server");

const { WebSocketPort, WSoptions, websitePort } = require("./config.json");

const launchApp = function (WebSocketPort, WSoptions, websitePort) {
	if (!WebSocketPort || !WSoptions)
		throw new Error(
			"⚠️ No WebSocket : 'WebSocketPort' || 'WSoptions' n'ont pas été défini dans config.json"
		);

	//Lancement serveur web
	const WebSite = require("./WebSite");
	if (websitePort) new WebSite(websitePort);

	// Instancie un serveur webSocket et gere l'evenementiel des différents sockets associés aux User
	SERVER = new Server(WebSocketPort, WSoptions);
};

module.exports = launchApp;
