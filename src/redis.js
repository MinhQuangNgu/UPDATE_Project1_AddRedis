const Redis = require("redis");
let redisClient = "";
(async () => {
	redisClient = Redis.createClient({
		url: "redis://default:RcScKV39SVEBbNaKfinFwEMKp9Abwi94@redis-11661.c1.asia-northeast1-1.gce.cloud.redislabs.com:11661",
	});
	redisClient.on("error", (err) => console.error("Redis Client Error", err));
	redisClient.on("ready", function () {
		console.log("redis is running");
	});
	await redisClient.connect();
})();

module.exports = redisClient;
