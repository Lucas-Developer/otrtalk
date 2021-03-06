var DHT = require("bittorrent-dht");
var debug = require("debug")("bittorrent");
var events = require("events");
var util = require("util");

util.inherits(Torrent, events.EventEmitter);

var instance;

var torrent = module.exports;

torrent.create = function () {
	if (instance) return instance;
	instance = new Torrent();
	return instance;
};

function Torrent() {
	var self = this;
	events.EventEmitter.call(self);
}

Torrent.prototype.start = function (socket) {
	var self = this;
	var dht = self._dht;
	if (dht) return;

	dht = self._dht = new DHT();

	debug("starting");

	dht.on('ready', function () {
		debug("ready");
		self.emit("ready");
	});

	dht.on('peer', function (addr, hash, from) {
		self.emit("peer", addr, hash);
	});

	if (socket) {
		dht.socket = socket;
		dht._port = socket.address().port;
		dht.listening = true;
		socket.on('message', dht._onData.bind(dht));
	} else {
		dht.listen(function () {
			debug("listening");
		});
	}
};

Torrent.prototype.stop = function () {
	var self = this;
	if (self._dht) self._dht.destroy();
	delete self._dht;
};

Torrent.prototype.announce = function (infohash, port) {
	var self = this;
	if (self._dht && self._dht.ready) self._dht.announce(infohash, port, function (err) {
		if (err) debug(err);
	});
};

Torrent.prototype.lookup = function (infohash) {
	var self = this;
	if (self._dht && self._dht.ready) {
		self._dht.lookup(infohash, function (err) {
			if (err) debug(err);
		});
	}
};
