var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var settings = require('../settings');

module.exports = gameGiftpack;

function gameGiftpack(info) {
	this.platform = parseInt(info.platform);
	this.wuid = parseInt(info.wuid);
}

gameGiftpack.query = function(condition, callback){
	if (parseInt(condition.platform) === 1){
		var values = [];
		MongoClient.connect("mongodb://"+settings.server.simplified_backup.host+":"+settings.server.simplified_backup.port+"/"+getDbName(), function(error, db){
			db.collection('game_giftpack_buy', function(error, collection){
				collection.find({_id: condition.wuid}).toArray(function(error, results){
					for (var i = 0; i < results.length; i++) {
						for (var j = 0; j < results[i].l.length; j++) {
							values.push({"i":results[i].l[j].i, "a": results[i].l[j].a, "d": getDateTime(results[i].l[j].d), "da": getMaxValueAsDay(results[i].l[j].da)});
						}
					}
					db.close();
					values.sort(by("i"));
					callback(null, values);
				})	
			})
		})
	}
	else {
		MongoClient.connect("mongodb://"+settings.server.traditional_backup.host+":"+settings.server.traditional_backup.port+"/"+getDbName(), function(error, db){
			db.collection('game_giftpack_buy', function(error, collection){
				collection.find({_id: condition.wuid}).toArray(function(error, results){
					for (var i = 0; i < results.length; i++) {
						for (var j = 0; j < results[i].l.length; j++) {
							values.push({"i":results[i].l[j].i, "a": results[i].l[j].a, "d": getDateTime(results[i].l[j].d), "da": getMaxValueAsDay(results[i].l[j].da)});
						}
					}
					db.close();
					values.sort(by("i"));
					callback(null, values);
				})	
			})
		})

	}

}

function getDbName(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
}

var by = function(name){
    return function(o, p){
        var a, b;
        if (typeof o === "object" && typeof p === "object" && o && p) {
            a = o[name];
            b = p[name];
            if (a === b) {
                return 0;
            }
            if (typeof a === typeof b) {
                return a < b ? -1 : 1;
            }
            return typeof a < typeof b ? -1 : 1;
        }
        else {
            throw ("error");
        }
    }
}

function getDateTime(day){
	if (day === undefined){
		return null;
	}
	else {
		var timestamp = new Date(parseInt(day*86400000));
		return (timestamp.getFullYear()+"-"+(timestamp.getMonth()+1)+"-"+timestamp.getDate()).toString();
	}
}

function getMaxValueAsDay(value){
	if (value === undefined){
		return 0;
	}
	else {
		return value;
	}
}
