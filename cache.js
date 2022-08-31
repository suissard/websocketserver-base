class Topic {
	constructor(topics, value) {
		this.value = value ? value : "";
		this.topics = topics ? { topics } : {};
	}
	get(topic) {
		let path = topic.split("/");
		let data = this;
		try {
			for (let i in path) {
				let part = path[i];
				data = data.topics[part];
			}
			return data;
		} catch (e) {
			console.error("❌ Pas de donnée en cache pour ce topic : " + topic);
			return undefined;
		}
	}
	getAllTopics(parentTopic) {
		let result = []
		parentTopic = parentTopic ? parentTopic + '/':""
		for (let topicName in this.topics) {
			let topic = this.topics[topicName];
			if (topic.value)result.push({topic:parentTopic + topicName, value:topic.value})
			result = [...topic.getAllTopics(parentTopic + topicName), ...result]}
		return result
	}
	map(
		func = (x) => {
			return x;
		}
	) {
		let array = [];
		for (let i in this.topics) array.push(func(this.topics[i]));

		return array;
	}
}

class Cache {
	/**
	 * Gere les données provenant d'un Broker en écoutant les evenements en provenance du client
	 * Fait emettre par le client, dataUpdate et dataNew
	 * @param {EventListener} client
	 * @param {String} event
	 */
	constructor(client, event = "message") {
		this.client = client;
		this.topics = new Topic();
		this.client.on(event, this.handleEvent.bind(this));
	}

	/**
	 * Prend en charge les evenements envoyés par le client et emet les evenements dataUpdate et dataNew
	 * @param {String} topic
	 * @param {String} message
	 */
	handleEvent(topic, message) {
		let { newValue, oldValue } = this.set(topic, message.toString());

		if (oldValue !== newValue) {
			//compare les anciennes données avec les nouvelles
			if (!oldValue) this.client.emit("dataNew", topic, newValue, oldValue);
			this.client.emit("dataUpdate", topic, newValue, oldValue);
		}
	}

	/**
	 * Integre les données d'un topic dans le cache si elle sont différente de celle existantes
	 * @param {String} topic
	 * @param {String} newValue
	 * @returns {Object} { newValue, oldValue }
	 */
	set(topic, newValue) {
		let path = topic.split("/");
		let data = this.client.cache.topics;
		for (let part of path) {
			if (!data.topics[part]) data.topics[part] = new Topic();
			data = data.topics[part];
		}

		let oldValue = data.value;
		if (oldValue !== newValue) data.value = newValue;
		return { newValue, oldValue };
	}

	/**
	 * Recuperer les données d'un topic
	 * @param {String} topic
	 * @returns {Topic} Topic
	 */
	get(topic) {
		try {
			let data = this.topics;
			for (let part of topic.split("/")) data = data.topic[part];

			return data;
		} catch (e) {
			console.error("❌ Pas de donnée pour ce topic : " + topic);
			return undefined;
		}
	}

	/**
	 * WIP Renvoit un format string comprehensible pour un humain
	 * @param {String} topic
	 * @returns
	 */
	stringify(topic) {
		return JSON.stringify(this.get(topic)).replace("value", "");
	}
}

module.exports = {Topic, Cache};

// let json = JSON.stringify({"value":"","topic":{"shellies":{"value":"","topic":{"bulbVintage":{"value":"","topic":{"light":{"value":"","topic":{"0":{"value":"on","topic":{"status":{"value":"{\"ison\":true,\"source\":\"mqtt\",\"has_timer\":false,\"timer_started\":0,\"timer_duration\":0,\"timer_remaining\":0,\"brightness\":100, \"transition\":0}","topic":{}},"power":{"value":"6.00","topic":{}}}}}}}}}}}})
// console.log(json.replace(/"value":"",/g, '').replace(/"topic":{/g, ''))
