var http = require('http');
var fs = require('fs');
var url = require('url');
var BufferList = require('./modules/bufferlist');
var Downloader = require('./modules/downloader');
var config = require('./config.js').call();
var folders = config.client.folders;

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

function readTree(folder, res) {
	var buffer = new BufferList();
	res.on('data', function (data) {
		buffer.add(data);
	});
	res.on('end', function (data) {
		diffTree(folder, buffer.join().toString(), res);
	});
}

function diffTree(folder, remoteTree) {
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
			downloader.add(folders[folder] + file, folder + '/' + file);
			localTree[file] = remoteTree[file];
		}
	});

	downloader.start(function () {
		fs.writeFileSync(localTreeFile, JSON.stringify(localTree));
	});
}

Object.keys(folders).forEach(function (folder) {
	request(folders[folder], function (res) {
		readTree(folder, res);
	});
});

