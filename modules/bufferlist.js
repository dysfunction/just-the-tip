function BufferList() {
	this.bufferLength = 0;
	this.buffers = [];
}

BufferList.prototype.add = function (buffer) {
	this.bufferLength += buffer.length;
	this.buffers.push(buffer);
};

BufferList.prototype.length = function () {
	return this.buffers.length;
};

BufferList.prototype.join = function () {
	if (!this.buffers.length) {
		return;
	}
	
	var result = new Buffer(this.bufferLength);
	var start = 0;
	this.buffers.forEach(function (buffer) {
		buffer.copy(result, start);
		start += buffer.length;
	});

	return result;
};

module.exports = BufferList;