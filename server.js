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

		return output(res, 200, data);
	}
}

function dispatch(res, repo, task) {
	if (task === 'list') {
		return repo.getTree('HEAD', true, respond(res));
	}

	return output(res, 500, { error: 'Invalid dispatch task' });
}

require('http').createServer(function (req, res) {
	return Object.keys(config.repos).some(function (repo) {
		var matches = req.url.match(/^\/([^\/]+)/);

		if (!matches) {
			return false;
		}

		if (matches[1] !== repo) {
			return false;
		}

		dispatch(res, new Git(config.repos[repo]), 'list');
		return true;
	}) || output(res, 404, { error: 'Not found' });
}).listen(config.port || 8080);
