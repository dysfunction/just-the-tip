var Client = require('./client');
var config = require('./config.js').call();

new Client(config.client).sync();
