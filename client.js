var http = require('http');
var fs = require('fs');
var url = require('url');
var BufferList = require('./modules/bufferlist');
var Downloader = require('./modules/downloader');

function error(err) {
	console.log('[ERROR]', err.toString());
	process.exit(1);
}

function request(uri, callback) {
	var remote = url.parse(uri);

	http.get({
		host: remote.hostname,
		port: remote.port,
		path: remote.path
	}, callback).on('error', error);
}

function Client(config) {
	this.config = config;
	this.folders = config.folders;
}

Client.prototype.readTree = function (folder, res) {
	var buffer = new BufferList();
	res.on('data', function (data) {
		buffer.add(data);
	});
	res.on('end', function (data) {
		this.diffTree(folder, buffer.join().toString(), res);
	}.bind(this));
}

Client.prototype.diffTree = function (folder, remoteTree) {
	var localTree, localTreeFile = folder + '/sync-tree.json';

	try {
		remoteTree = JSON.parse(remoteTree).files;
	} catch (e) {
		return error(e);
	}

	try {
		localTree = JSON.parse(fs.readFileSync(localTreeFile));
	} catch (e) {
		localTree = {};
	}

	var downloader = new Downloader();

	Object.keys(remoteTree).forEach(function (file) {
		if (!localTree[file] || localTree[file] !== remoteTree[file]) {
			downloader.add(this.folders[folder] + file, folder + '/' + file);
			localTree[file] = remoteTree[file];
		}
	}.bind(this));

	downloader.start(function () {
		fs.writeFileSync(localTreeFile, JSON.stringify(localTree));
	});
}

Client.prototype.sync = function () {
	Object.keys(this.folders).forEach(function (folder) {
		request(this.folders[folder], function (res) {
			this.readTree(folder, res);
		}.bind(this));
	}.bind(this));
};

module.exports = Client;
