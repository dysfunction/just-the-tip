var Queue = require('./queue');
var BufferList = require('./bufferlist');
var spawn = require('child_process').spawn;

function queueNext(queue, callback) {
	return function (err, data) {
		callback(err, data);
		queue.next();
	};
}

function extractLines(input) {
	return input.split(/[\r\n]+/).filter(function (line) {
		return line.length > 0;
	});
}

function gitStream(path, args, onError, onData, onComplete) {
	var proc = spawn('git', args, { cwd: path });
	proc.stdout.on('data', onData);
	proc.stderr.on('data', onError);
	proc.on('close', onComplete);
}

/* Callback params (err <Buffer>, data <Buffer>) */
function gitBuffer(path, args, callback) {
	var errors = new BufferList();
	var result = new BufferList();

	function onError(err) {
		errors.add(err);
	}

	function onData(data) {
		result.add(data);
	}

	gitStream(path, args, onError, onData, function () {
		callback(errors.join(), result.join());
	});
}

/* Callback params: (err <string>, data <string>) */
function git(path, args, callback) {
	gitBuffer(path, args, function (err, data) {
		callback(err && err.toString('utf8'), data && data.toString('utf8'));
	});
}

/* Callback params: (err <string>, refs <Object>) */
function showRefs(path, callback) {
	git(path, ['show-ref'], function (err, data) {
		if (err) {
			return callback(err);
		}

		var refs = {};
		extractLines(data).forEach(function (line) {
			var chunks = line.split(/\s+/), matches;
			if (chunks.length < 2) {
				return;
			}

			matches = chunks[1].match(/\/([^\/]+)$/);
			if (!matches) {
				return;
			}

			refs[matches[1]] = chunks[0];
		});

		callback(err, refs);
	});
}

function Git(path) {
	this.path = path;
	this.queue = new Queue();
}

/* Callback params: (err <string>, stdout <string>) */
Git.prototype.git = function (command, callback) {
	var cmd = command;

	if (typeof command === 'string') {
		cmd = command.split(/ /);
	}

	this.queue.add(function () {
		git(this.path, cmd, queueNext(this.queue, callback));
	}.bind(this));
};

/* Callback params: (err <Buffer>, data <Buffer>) */
Git.prototype.getFile = function (tree, file, callback) {
	this.queue.add(function () {
		gitBuffer(this.path, ['cat-file', '-p', tree + ':' + file], queueNext(this.queue, callback));
	}.bind(this));
};

/* Callback params (err <Buffer>, data <Buffer>) */
Git.prototype.getTree = function (tree, callback) {
	this.queue.add(function () {
		gitBuffer(this.path, ['ls-tree', tree], queueNext(this.queue, callback));
	}.bind(this));
};

/* Callback params: (err <string>, refs <Object>) */
Git.prototype.showRefs = function (callback) {
	this.queue.add(function () {
		showRefs(this.path, queueNext(this.queue, callback));
	}.bind(this));
};

module.exports = Git;
