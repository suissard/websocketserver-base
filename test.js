let brokerObject = {
    lastCall: new Date().toISOString(),
    errorTimer: 3600,
    tag: ["this.type"],
};
test = JSON.stringify(brokerObject)

console.log(test)
console.log(test.match(/\"lastCall\"\:\" +\"\,\"errorTimer\"\:[0-9]+\,\"tag\"\: +/))
