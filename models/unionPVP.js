var MongoClient = require('mongodb').MongoClient;

var handler = module.exports;

handler.pvp_area = function(args, callback){
	var results = [];
	if (args.platform === 1){
		MongoClient.connect('mongodb://10.96.36.40:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pvp_area', function (err, collection) {
				if (err) {
					mongo.simplified.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, areaId: values[i].areaId});
					}
					return callback(null, results);
				})
			}
		})
	}
	else {
		MongoClient.connect('mongodb://54.238.138.78:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pvp_area', function (err, collection) {
				if (err) {
					mongo.traditional.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, areaId: values[i].areaId});
					}
					return callback(null, results);
				})
			}
		})
	}
}

handler.pvp_arena = function(args, callback){
	var results = [];
	if (args.platform === 1){
		MongoClient.connect('mongodb://10.96.36.40:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pvp_arena', function (err, collection) {
				if (err) {
					mongo.simplified.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, areaId: values[i].areaId, arenaId: values[i].arenaId, wuid: values[i].wuid});
					}
					return callback(null, results);
				})
			}
		})
	}
	else {
		MongoClient.connect('mongodb://54.238.138.78:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pvp_arena', function (err, collection) {
				if (err) {
					mongo.traditional.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, areaId: values[i].areaId, arenaId: values[i].arenaId, wuid: values[i].wuid});
					}
					return callback(null, results);
				})
			}
		})
	}
}

handler.pve_result = function(args, callback){
	var results = [];
	if (args.platform === 1){
		MongoClient.connect('mongodb://10.96.36.40:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pve_result', function (err, collection) {
				if (err) {
					mongo.simplified.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, p: values[i].p, gkld: values[i].gkld});
					}
					return callback(null, results);
				})
			}
		})
	}
	else {
		MongoClient.connect('mongodb://54.238.138.78:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_pve_result', function (err, collection) {
				if (err) {
					mongo.traditional.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, w: values[i].w, eld: values[i].eld, p: values[i].p, gkld: values[i].gkld});
					}
					return callback(null, results);
				})
			}
		})
	}
}

handler.bet_item_list = function(args, callback){
	var results = [];
	if (args.platform === 1){
		MongoClient.connect('mongodb://10.96.36.40:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_bet_item_list', function (err, collection) {
				if (err) {
					mongo.simplified.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, iId: values[i].iId, et: values[i].et, mp: values[i].mp, ip: values[i].ip});
					}
					return callback(null, results);
				})
			}
		})
	}
	else {
		MongoClient.connect('mongodb://54.238.138.78:27017/'+getGameDB(), function(err, db) {
			if (err) {
				mongo.traditional.close();
				return callback(err);//错误，返回 err 信息
			}
			db.collection('game_union_bet_item_list', function (err, collection) {
				if (err) {
					mongo.traditional.close();
					return callback(err);//错误，返回 err 信息
				}
				collection.find().toArray(function(error, values){
					if (!result) { callback(error); }
					for (var i = 0; i < values.length; i++) {
						results.push({id: values[i]._id, iId: values[i].iId, et: values[i].et, mp: values[i].mp, ip: values[i].ip});
					}
					return callback(null, results);
				})
			}
		})
	}
}

function getGameDB(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
}