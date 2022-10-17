const User = require("../../Class/User.js");

class Game {
	/**
	 *
	 * @param {Object} data
	 * @param {String} data.lobbyId ID du lobby associé
	 * @param {String} data.type Type de jeu
	 * @param {String} data.ownerId Id du propriétaire de la session de jeu
	 * @param {Number} data.maxPlayerSize Nombre limite de joueurs. 0 indique une infinité de joueurs
	 * @param {String} data.playersId
	 * @param {String} data.state Etat du jeu ("create" par defaut) :
	 * + create : le jeu est creer mais pas lancer
	 * + checkIn : Tout le monde est inscrit et valide sa présence
	 * + allCheck : tout le monde a validé sa présence, le jeu peut etre lancé par le owner
	 * + inProgress : Le jeu est en cours
	 * + finish : le jeu est terminé
	 * + stopped : le jeu a été arreté par les joueurs
	 * + bugged : le jeu a buggé et ne peut pas etre poursuivis
	 * @param {Number} data.createdAt
	 * @param {String} data.start Timestamps de démarrage
	 * @param {String} data.end Timestamps de fin
	 * @param {String} data.logs Logs complet du jeu (permettrai un retour arriere)
	 */
	constructor(data) {
		let {
			lobbyId,
			type,
			ownerId,
			minPlayerSize,
			maxPlayerSize,
			playersId,
			state,
			createdAt,
			start,
			end,
			logs,
		} = data;

		this.lobbyId = lobbyId;
		this.ownerId = ownerId;
		this.type = type;

		this.minPlayerSize = minPlayerSize ? minPlayerSize : 0;
		this.maxPlayerSize = maxPlayerSize ? maxPlayerSize : 0;
		this.playersId = playersId ? playersId : [ownerId];

		/**
		 * identifiant du jeu, composé de l'id de lobby, de l'id du owner et du type de jeu
		 * => un seul jeu du meme type, par le meme owner peut etre lancé dans un lobby
		 */
		this.id = lobbyId + "--" + ownerId + "--" + type;

		this.state = state ? state : "create";

		/**
		 * id de Player ayant validé leur présence
		 */
		this.check = [];
		this.createdAt = createdAt ? createdAt : Date.now();

		this.start = start;
		this.end = end;

		this.logs = new Logs(logs);

		/**
		 * Listes des permissions possible par un certain utilisateur selon dun fonction de condition
		 */
		this.permissions = {
			addPlayer: (authUser = {}) => this.ownerId == authUser.id && this.state == "create",
			removePlayer: (authUser = {}) =>
				this.ownerId == authUser.id && this.state == "create",
			starting: (authUser = {}) =>
				this.ownerId == authUser.id && this.state == "allCheck",
			checkIn: (authUser = {}) => ["create", "checkIn"].includes(this.state),
			checkOut: (authUser = {}) => ["checkIn", "allCheck"].includes(this.state),
			surrender: (authUser = {}) => !["inProgress"].includes(this.state),
		};

		this.leaderBoard = [];
	}

	/**
	 * Ajouter un joueur de la liste de joueur
	 * @param {String} playerId identifiant de User correspondant au joueur
	 */
	addPlayer(playerId) {
		if (this.maxPlayerSize && this.playersId.length >= this.maxPlayerSize)
			throw new Error("La partie est pleine");
		if (this.state !== "create") throw new Error("La partie a déjà commencée");
		if (this.playersId.includes(playerId))
			throw new Error("Le joueur est déjà dans la partie");
		this.playersId.push(playerId);
	}

	/**
	 * Retirer un joueur de la liste de joueur
	 * @param {String} playerId identifiant de User correspondant au joueur
	 */
	removePlayer(playerId) {
		if (this.state == "finish") throw new Error("La partie est finit");
		if (!this.playersId.includes(playerId))
			throw new Error("Le joueur n'est pas présent dans la partie");
		this.playersId.splice(Array.indexOf(this.playersId[playerId]), 1);
	}

	/**
	 * Valider la présence d'un player. Si ce joueur est le owner, changement de state => checkIn
	 * @param {String} playerId id du joueur prêt
	 */
	checkIn(playerId) {
		if (this.check.includes(playerId))
			throw new Error("Le joueur a déjà validé sa présence");
		this.check.push(playerId);
		if (playerId == this.ownerId) this.state = "checkIn";
		this.checkCheckIn();
	}
	/**
	 * Dévalider la présence d'un player
	 * @param {String} playerId id du joueur qui n'est plus prêt
	 */
	checkOut(playerId) {
		if (!this.check.includes(playerId))
			throw new Error("Le joueur n'a pas encore validé sa présence");
		this.playersId.splice(Array.indexOf(this.playersId[playerId]), 1);
		this.checkCheckIn();
	}

	/**
	 * Déclarer le démarrage du jeu
	 */
	starting() {
		if (!this.checkCheckIn()) throw new Error("Tout le monde n'est pas prêt");
		this.state = "inProgress";
	}

	/**
	 * Un joueur annule sa participation apres le checkIn
	 * @param {String} userid id du joueur qui se rend
	 */
	surrender(userid) {
		this.playersId.splice(Array.indexOf(this.playersId[playerId]), 1);
	}

	/**
	 * Verifier si le state est sur "checkIn" et que suffisament de joueurs ont validés leur présence => change alors le state sur "allCheck" et renvoit true, sinon renvoit false
	 * @returns {Boolean} Renvoit true si les conditions d echeckIn sont remplit et false
	 */
	checkCheckIn() {
		if (this.state !== "checkIn" || this.check.length < this.minPlayerSize) return false;
		this.state = "allCheck";
		return true;
	}

	/**
	 * Déclarer la fin du jeu
	 */
	ending() {
		this.state = "finish";
	}

	/**
	 * Recuperer les infos du jeux
	 * @returns
	 */
	getInfos() {
		return JSON.parse(JSON.stringify(this));
	}

	getPrivateInfo() {
		return this.getInfos();
	}
	/**
	 * Recupere la listes des permissions accessible a l'utilisateur qui la demande
	 * @param {User} authUser user dont on doit verifier les permissions possibles
	 */
	getPermissions(authUser) {
		let result = [];
		for (let actionName in this.permissions) {
			if (this.permissions[actionName](authUser)) result.push(actionName);
		}
		return result;
	}

	/**
	 * Met a jour les données de jeu en fonction de donnée (utile uniquement coté client ?)
	 * @param {Object} data
	 */
	update(data) {
		for (let i in data) {
			this[i] = data[i];
		}
	}

	/**
	 * Nettoyer les entrées du jeu et les remplacer si d'autres données sont fournit
	 * @param {*} replace
	 */
	clean(replace = {}) {
		for (let i in this) delete this[i];

		for (let i in replace) this[i] = replace[i];
	}

	// ===== EVENTHANDLER ===================================================================================
	/**
	 * Receptionner les evenements de type action
	 * @param {User} user utilisateur emettant la requete
	 * @param {Object} data donnée de la requete
	 * @param {Object} data.action type d'action de jeu
	 * @param {Object} data.gameId Id du jeu cible
	 * @param {Object} data... autre données pouvant etre utiles
	 */
	handleAction(user, data) {
		if (!this.permissions[data.action](user))
			throw new Error("Vous en pouvez pas réaliser cette action"); // Verifier qeu l'utilisateur a le droit de réaliser l'action
		this[data.action](user, data); // Réaliser l'action
	}
}

module.exports = Game;
