class Log {
	constructor(log, index, logs) {
		let { timestamp, event, dataUpdate } = log;
		if (!event || !dataUpdate)
			throw new Error("Une log doit tjrs avoir event ou dataUpdate");
		this.timestamp = timestamp ? timestamp : Date.now();
		this.event = event;
		this.data = dataUpdate;

		Object.defineProperty(this, "getLogs", {
			value: () => logs,
		});
		Object.defineProperty(this, "getIndexInLogs", {
			value: () => index,
		});
	}

	/**
	 * Renvoie la log precedent celle ci ou undefined si c'est la première
	 * @returns {Log}
	 */
	prev() {
		if (this.getIndexInLogs()) return undefined;
		return this.getLogs()[this.getIndexInLogs() - 1];
	}
	/**
	 * Renvoie la log suivant celle ci ou undefined si c'est la dernière
	 * @returns {Log}
	 */
	next() {
		if (this.getIndexInLogs() == this.getLogs().length) return undefined;
		return this.getLogs()[this.getIndexInLogs() + 1];
	}
}

module.exports = Log;
