const User = require("../User.js");
const Lobby = require("../Lobby.js");
const Game = require("./Game.js")

class GamesManager extends Map {
	/**
	 * Creer un Jeu au sein d'un lobby
	 * @param {Lobby} lobby
	 * @param {User} user
	 * @param {Object} data
	 */
	createGame(lobby, user, data) {
		//TODO orienter en fonction du "type"
		if (!data.type) throw new Error("Un type doit etre précisé");
		let game = new Game({ ...data, lobbyId: lobby.getId(), ownerId: user.id });

		if (this.has(game.id)) throw new Error("Un Jeu avec ce nom existe déjà", user);
		this.set(game.id, game);
		user.success("Création du Jeu " + game.id);
		lobby.emitToAll("CreateGame", game.getInfos());
	}

	/**
	 * Mettre a jour un Game
	 * @param {Game} game lobby a update
	 * @param {Lobby} lobby lobby a update
	 * @param {Object} data contient les données a mettre a jour
	 */
	updateGame(game, lobby, data) {
		let modifications = {};
		for (let i in game) {
			let newProperty = data[i],
				actualProperty = game[i];
			if (newProperty === undefined || newProperty === actualProperty) continue;
			game[i] = newProperty;
			modifications[i] = newProperty;
		}
		if (modifications.length) lobby.emitToAll("UpdateGame", modifications);
		return game;
	}

	getInfos(authUser, gameId) {
		let result = [];
		for (let [i, game] of this) {
			if (gameId != game.id) continue;
			if (game.owner.id == authUser.id) {
				result.push(game.getPrivateInfo());
				continue;
			}
			if (game.visible || game.users.has(user.id)) result.push(game.getInfos());
		}
		return result;
	}
}

module.exports = GamesManager;
