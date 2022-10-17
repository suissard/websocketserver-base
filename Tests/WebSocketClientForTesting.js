const io from  "socket.io-client");

module.exports =class WebSocketClientForTesting {
	constructor(domain = "localhost", port = 3000, protocole = "http") {
		this.url = `${protocole}://${domain}:${port}`;

		this.lastEvent = ""
		this.lastData = {}
		// this.connectSocket();
	}

	setListener(socket) {
		socket.onAny((eventName, data) => {
			// console.log(`👤 WebsocketClient recoit : ${eventName}`, data);
			this.lastEvent = eventName
			if (typeof data == 'string')this.lastData = JSON.parse(data)
			else this.lastData = data
		});

		return socket; // Differents évenements a écouter
	}

	async connectSocket() {
			console.log("Client connect à " + this.url);
			let socket = await io(this.url, { cors: { origins: "*" } });
			this.socket = socket
			this.setListener(socket);
	}
	
	emit(event, data){
		this.socket.emit(event, data)
	}
}
