/**
 * Permt d'attendre une certaine durée dans une fonction asynchrone et avec un await
 * @param {Timestamp} timer  120 par default
 * @returns
 */
module.exports = function (timer = 120) {
	return new Promise((res) => setTimeout(res, timer));
};
