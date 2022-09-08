const Log = require("./Log.js")

class LogsManager extends Array {
	/**
	 * Log d'un jeu, tjrs par ordre croissant de timestamps
	 * @param {Array} logs Logs bruts
	 */
	constructor(logs) {
		super();
		for (let i in logs) this.addLog(logs[i]);
	}

	checkTimestamps() {}
	addLog(log) {
		return this.push(new Log(log, this.length, this));
	}
}

module.exports = LogsManager;