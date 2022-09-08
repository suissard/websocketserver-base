const Game = require("./Game.js");

class Puissance4 extends Game {
	constructor(data) {
		let { id, lobbyId, owner, playersId, state, createdAt, start, end, logs, board } =
			data;

		super({
			id,
			lobbyId,
			type: "Puissance4",
			owner,
			playerSizeLimit: 2,
			playersId,
			createdAt,
			start,
			end,
			logs,
		});


		this.actualUserTurn;
		this.state = state ? state : "create";
		this.board = board ? board : this.getEmptyBoard();

        this.actions = this.actions.concat(["fillColumn"])
	}

	starting() {
        super.starting()
		let startingPlayerIndex = Math.round(Math.random() * 2);
		this.actualUserTurn = this.playersId[startingPlayerIndex];
	}

	nextTurn() {
		let actualUserIndex = Array.indexOf(this.playersId[this.actualUserTurn]);
		this.actualUserTurn = this.playersId[(actualUserIndex + 1) % 2];
		this.store.updateActiveGameData(this.getInfos());
		Vue.prototype.$webSocket.emit("UpdateGame", this.getInfos());
	}
	getEmptyBoard() {
		let column = [];
		// let column = [undefined, undefined, undefined, undefined, undefined, undefined];

		return [column, column, column, column, column, column, column];
	}

	fillColumn(userId, columnIndex) {
		// let user = Vue.prototype.$DataBase.users.get(UserId)
		if (this.board[columnIndex].length >= 6)
			throw new Error(`La colonne ${columnIndex + 1} est pleine`);
		if (this.actualUserTurn !== userId)
			throw new Error(`Ce n'est pas au tour de ce joueur`);
		this.board[columnIndex].push(userId);

		this.checkVictory();
		this.nextTurn();
	}
	checkVictory() {
		// return false
		// return victoryUserId
	}
}

module.exports = Puissance4;
