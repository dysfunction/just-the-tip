var url = require('url');
var http = require('http');
var fs = require('fs');

function mkdir(folder) {
	var current, folders = folder.split(/\//).slice(0, -1);

	while (folders.length) {
		if (!current) {
			current = folders.shift();
		} else {
			current = [current].concat(folders.shift()).join('/');
		}

		try {
			fs.mkdirSync(current);
		} catch (e) {}
	}
}

function Downloader() {
	this.maxConnections = 6;
	this.count = 0;
	this.queue = [];
}

Downloader.prototype.add = function (url, destination) {
	this.queue.push({
		url: url,
		destination: destination
	});
};

Downloader.prototype.download = function (uri, callback) {
	var remote = url.parse(uri);

	http.get({
		host: remote.hostname,
		port: remote.port,
		path: remote.path
	}, callback).on('error', function (err) {
		console.log('[ERROR]', err.toString());
		process.exit(1);
	});
};

Downloader.prototype.start = function (callback) {
	this.callback = callback;
	var cb = callback || cb();
	var count = 0;
	var queue = this.queue;

	function completed() {
		count += 1;
		if (count === queue.length) {
			callback();
		}
	}

	queue.forEach(function (item) {
		this.download(item.url, function (res) {
			console.log('Downloading:', item.url);
			mkdir(item.destination);

			var stream = fs.createWriteStream(item.destination);
			res.on('data', function (data) {
				stream.write(data);
			});

			res.on('end', completed);
		});
	}.bind(this));
};

module.exports = Downloader;
