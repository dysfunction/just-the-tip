var Git = require('./modules/git');
var config = require('./config.js').call();

function output(res, code, data, mime) {
	var message, type = mime || 'text/plain';

	if (typeof data !== 'string' && data.constructor !== Buffer) {
		try {
			message = JSON.stringify(data);
			type = 'application/json';
		} catch (e) {
			message = null;
		}
	}

	if (!message) {
		message = data.toString();
	}

	res.writeHead(code, {
		'Content-Type': type,
		'Connection': 'close',
		'Content-Length': message.length
	});

	res.end(message);
}

function respond(res) {
	return function (err, data) {
		if (err) {
			return output(res, 500, err);
		}

		output(res, 200, data);
	};
}

function listTree(res, repo) {
	repo.getTree('HEAD', true, function (err, data) {
		if (err) {
			return output(res, 500, err);
		}

		var files = {};
		data.toString().split(/\r?\n/).forEach(function (line) {
			var matches = line.match(/\s([^\t\s]+)\t(.+)$/);
			if (!matches) {
				return;
			}

			files[matches[2]] = matches[1];
		});

		output(res, 200, { files: files });
	});
}

function serveFile(res, repo, file) {
	var writeStarted = false;

	repo.stream(
		['cat-file', '-p', 'HEAD:' + file],
		function (err) {
			output(res, 500, { error: err.toString() });
		},
		function (data) {
			if (!writeStarted) {
				writeStarted = true;
				res.writeHead(200, {
					'Content-Type': 'application/octet-stream',
					'Connection': 'close'
				});
			}

			res.write(data);
		},
		function () {
			res.end();
		}
	);
}

require('http').createServer(function (req, res) {
	return Object.keys(config.server.repos).some(function (repo) {
		var git, matches = req.url.match(/^\/([^\/]+)\/?(.*)$/);

		if (!matches) {
			return false;
		}

		if (matches[1] !== repo) {
			return false;
		}

		git = new Git(config.server.repos[repo]);

		if (matches[2]) {
			serveFile(res, git, matches[2]);
		} else {
			listTree(res, git);
		}

		return true;
	}) || output(res, 404, { error: 'Not found' });
}).listen(config.server.port || 8080);
