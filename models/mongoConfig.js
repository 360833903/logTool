var settings = require('../settings');

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

//module.exports = new Db(settings.dbname, new Server(settings.host, Connection.DEFAULT_PORT), {safe: true});
var simplifiedDb = new Db(settings.server.simplified.db, new Server(settings.server.simplified.host, Connection.DEFAULT_PORT, {auto_reconnect: true}), {safe: true});
var traditionalDb = new Db(settings.server.traditional.db, new Server(settings.server.traditional.host, Connection.DEFAULT_PORT, {auto_reconnect: true}), {safe: true});
module.exports = {simplified: simplifiedDb, traditional: traditionalDb};
//module.exports = {simplified: simplifiedDbLog, traditional: traditionalDbLog};

