var fs = require('fs');
var async = require('async');
var mongo = require('mongodb');
var Collection = require('mongodb').Collection;
var mongoClient = require('mongodb').MongoClient;

var settings = require('../settings');

exports.query_user_mid_as_server_and_name = function(server, name, callback){
	async.waterfall([
		function (callback){
			mongoClient.connect("mongodb://" + settings.server.simplified_backup.host + ':' + settings.server.simplified_backup.port + '/' + getDbName(), function(error, getdb){
				if (!error){
					getdb.collection('game_user', function(error, coll){
						if (!error){
							coll.find({w: parseInt(server), n: name.toString()}, {_id:1}).toArray(function(error, result){
								if (!error && result.length != 0){
									getdb.close();
									callback(null, result[0]._id);
								}
								else {
									getdb.close();
									callback(error, 0);
								}
							})
						}
						else {
							getdb.close();
							callback(error, 0);
						}
					})
				}
				else {
					getdb.close();
					callback(error, 0);
				}
			})
		},
		function(wuid, callback){
			mongoClient.connect("mongodb://" + settings.server.simplified_backup.host + ':' + settings.server.simplified_backup.port + '/login_db', function(error, getdb){
				if (!error){
					getdb.collection('common_user', function(error, coll){
						if (!error){
							coll.find({_id: mongo.Long.fromNumber(wuid).getHighBits()}, {mid:1}).toArray(function(error, result){
								if (!error && result.length != 0){
									getdb.close();
									callback(null, result[0].mid);
								}
								else {
									getdb.close();
									callback(error, 0);
								}
							})
						}
						else {
							getdb.close();
							callback(error, 0);
						}
					})
				}
				else {
					getdb.close();
					callback(error, 0);
				}
			})
		}
		
	], function(error, result){
		callback(error, result);
	})
}



function getDbName(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
}