function Queue() {
	this.items = [];
	this.waiting = false;
}

Queue.prototype.add = function (fn) {
	this.items.push(fn);

	/* Nothing else in queue.. process immediately */
	if (!this.waiting && this.items.length === 1) {
		this.next();
	}
};

Queue.prototype.next = function () {
	if (this.items.length) {
		this.waiting = true;
		process.nextTick(this.items.shift());
	} else {
		this.waiting = false;
	}
};

module.exports = Queue;
