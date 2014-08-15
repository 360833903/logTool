var fs = require('fs');
var async = require('async');
var Collection = require('mongodb').Collection;
var MongoClient = require('mongodb').MongoClient;

var mongo = require('./mongoConfig');
var settings = require('../settings');
var eventType = require('../public/javascripts/eventType').EventType;

module.exports = Statistical;

function Statistical(info) {
	this.platform = parseInt(info.platform);
	this.opeType = parseInt(info.opeType)
	this.startServer = parseInt(info.startServer) < parseInt(info.endServer) ? parseInt(info.startServer) :parseInt(info.endServer);
	this.endServer = parseInt(info.startServer) > parseInt(info.endServer) ? parseInt(info.startServer) :parseInt(info.endServer);
	this.startTime = getStartTimestamp(info.startTime);
	this.endTime = getEndTimestamp(info.endTime);
	this.typeValue = parseInt(info.typeValue);
};

Statistical.queryUsersData = function(info, callback){
	//console.log(info);
	if (info.platform === 1) {
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}

			var results = [];
			var start = info.startServer;
			async.whilst(
				function(){ return start <= info.endServer; },
				function(cb){
					//读取collection集合
					db.collection("nba_ope_log_"+start, function (err, collection) {
						if (err) {
							mongo.simplified.close();
							return callback(err);//错误，返回 err 信息
						}

						//查找数据
						var condition = {};
						if (info.opeType === 1) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							//console.log(condition, info.startTime, info.endTime);
							collection.find(condition, {_id:0, t:0, f0: 0, f5:0, f6: 0}).limit(50).toArray(function(error, values){
								if (error) {
									return callback(error);
								}else {
									for (var i = 0; i < values.length; i++) {
										var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, diamond: values[i].f4};
										results.push(data);
									}
									++start;
									cb(null, 'ok');
								}								
							})
						}
						else if (info.opeType === 2) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 142, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 500}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									//console.log(values[i]);
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}									
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 3) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 500}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 4) {
							condition = {f0: 116, f1:{$gte: info.startTime, $lt: info.endTime}, f5: info.typeValue.toString()};
							collection.find(condition, {_id:0, s:1, f1:1, f2:1, f5:1}).limit(50).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, amount: values[i].f5};
									results.push(data);
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 5) {
							collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: {server: '$s', ope: '$f0', type: '$f3'}, total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i]._id.server, ope: values[i]._id.ope, type: getEventName(parseInt(values[i]._id.type)), amount: values[i].total, time: getDateTime(info.startTime)});
								}
								++start;
								cb(null, 'ok');
							})

						}
						else if (info.opeType === 6) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							//console.log(condition);
							collection.find(condition).limit(100).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, amount: values[i].f4, diamond: values[i].f5});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 7) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								resValues = [];
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total)});
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": parseInt(values[i].total)*10});
                  					}
                  					else {
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"灵魂宝石", "gems": (((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total))});
                  					}
                				}
                				sortAndMergeData(resValues, results, "starLevel", function(error, results){
                					++start;
                					cb(null, 'ok');
                				})
							})
						}
						else if (info.opeType === 8) {
							//console.log(info);
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total));
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", parseInt(values[i].total)*10);
                  					}
                  					else {
            							summationUpgradeStar(results, values[i]._id, values[i].total, "灵魂宝石", ((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total));
                  					}
                				}
                				results.sort(by("starLevel"));
                				++start;
                				cb(null, 'ok');
                				
							})
						}
						else if (info.opeType === 9){
							if (info.typeValue === 0){
								++start;
								cb(null, 'ok');
							}
							else {
								condition = {f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
								collection.find(condition).toArray(function(error, values){
									var diamond = amount = 0;
									for (var i = 0; i < values.length; i++) {
										amount += parseInt(values[i].f4);
										diamond += parseInt(values[i].f5);
									}
									results.push({"server": start, "time": getDateTimeRange(parseInt(info.startTime), parseInt(info.endTime)-1), "type": info.typeValue, "amount": amount, "diamond": diamond});
									++start;
									cb(null, 'ok');
								})
							}							
						}
						else if (info.opeType === 10) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: '$f3', total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, type: getEventName(values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 11) {
							var timestamp = getDateTime(info.startTime);
							var typeValue = (info.typeValue===0)?"false":"true";
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}, f4: typeValue}}, {$limit: 50}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total, win: typeValue};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 12) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30014: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30014'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 13) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30012: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30012'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 14) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30013: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30013'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 15) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f5: {$gte:0}}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue, f5: {$gte:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id, type: getEventName(info.typeValue), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 16){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 17){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue}}, {$limit: 50}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 18){
							if (info.typeValue === 0){
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}}).limit(50).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).limit(50).toArray(function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 19){
							if (info.typeValue != 0){
								collection.find({f0: 144, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).limit(50).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, startLevel: values[i].f4, status: values[i].f5});
									}
									++start;
									cb(null, 'ok');
								})
							} else {
								++start;
								cb(null, 'ok');
							}
						}
						else {
							return callback(null, []);
						}
					});
				},
				function(error, result){
					mongo.simplified.close();
					callback(null, results);	
				}
			)
		});
	}
	else if (info.platform === 2){
		mongo.traditional.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}

			var results = [];
			var start = info.startServer;
			async.whilst(
				function(){ return start <= info.endServer; },
				function(cb){
					//读取collection集合
					db.collection("nba_ope_log_"+start, function (err, collection) {
						if (err) {
							mongo.traditional.close();
							return callback(err);//错误，返回 err 信息
						}
						//查找数据
						var condition = {};
						if (info.opeType === 1) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition, {_id:0, t:0, f0: 0, f5:0, f6: 0}).limit(50).toArray(function(error, values){
								if (error) {
									return callback(error);
								}else {
									for (var i = 0; i < values.length; i++) {
										var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, diamond: values[i].f4};
										results.push(data);
									}
									++start;
									cb(null, 'ok');
								}								
							})
						}
						else if (info.opeType === 2) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 142, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}									
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 3) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 4) {
							var condition = {f0: 116, f1:{$gte: info.startTime, $lt: info.endTime}, f5: info.typeValue.toString()};
							collection.find(condition, {_id:0, s:1, f1:1, f2:1, f5:1}).limit(50).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, amount: values[i].f5};
									results.push(data);
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 5) {
							collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: {server: '$s', ope: '$f0', type: '$f3'}, total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i]._id.server, ope: values[i]._id.ope, type: getEventName(parseInt(values[i]._id.type)), amount: values[i].total, time: getDateTime(info.startTime)});
								}
								++start;
								cb(null, 'ok');
							})

						}
						else if (info.opeType === 6) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition).limit(100).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, amount: values[i].f4, diamond: values[i].f5});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 7) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								resValues = [];
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total)});
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": parseInt(values[i].total)*10});
                  					}
                  					else {
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"灵魂宝石", "gems": (((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total))});
                  					}
                				}
                				sortAndMergeData(resValues, results, "starLevel", function(error, results){
                					++start;
                					cb(null, 'ok');
                				})
							})
						}
						else if (info.opeType === 8) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total));
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", parseInt(values[i].total)*10);
                  					}
                  					else {
            							summationUpgradeStar(results, values[i]._id, values[i].total, "灵魂宝石", ((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total));
                  					}
                				}
                				results.sort(by("starLevel"));
                				++start;
                				cb(null, 'ok');
                				
							})
						}
						else if (info.opeType === 9){
							if (info.typeValue === 0){
								++start;
								cb(null, 'ok');
							}
							else {
								condition = {f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
								collection.find(condition).toArray(function(error, values){
									var diamond = amount = 0;
									for (var i = 0; i < values.length; i++) {
										amount += parseInt(values[i].f4);
										diamond += parseInt(values[i].f5);
									}
									results.push({"server": start, "time": getDateTimeRange(parseInt(info.startTime), parseInt(info.endTime)-1), "type": info.typeValue, "amount": amount, "diamond": diamond});
									++start;
									cb(null, 'ok');
								})
							}							
						}
						else if (info.opeType === 10) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: '$f3', total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, type: getEventName(values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 11) {
							var timestamp = getDateTime(info.startTime);
							var typeValue = (info.typeValue===0)?"false":"true";
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}, f4: typeValue}}, {$limit: 50}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total, win: typeValue};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 12) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30014: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30014'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 13) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30012: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30012'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 14) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30013: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30013'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: values[i]._id, diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 15) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f5: {$gt:0}}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue, f5: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id, type: getEventName(info.typeValue), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 16){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue}}, {$limit: 50}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 17){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue}}, {$limit: 50}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: values[i]._id.wuid, type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 18){
							if (info.typeValue === 0){
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}}).limit(50).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).limit(50).toArray(function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 19){
							if (info.typeValue != 0){
								collection.find({f0: 144, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).limit(50).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: values[i].f2, cardId: values[i].f3, startLevel: values[i].f4, status: values[i].f5});
									}
									++start;
									cb(null, 'ok');
								})
							} else {
								++start;
								cb(null, 'ok');
							}
						}
						else {
							return callback(null, []);
						}
					});
				},
				function(error, result){
					mongo.traditional.close();
					callback(null, results);	
				}
			)
		});
	}
	else{
		callback(1);
	}
}

Statistical.exportUsersData = function(info, callback){
	//console.log(info);
	if (info.platform === 1) {
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}

			var results = [];
			var start = info.startServer;
			async.whilst(
				function(){ return start <= info.endServer; },
				function(cb){
					//读取collection集合
					db.collection("nba_ope_log_"+start, function (err, collection) {
						if (err) {
							mongo.simplified.close();
							return callback(err);//错误，返回 err 信息
						}
						//查找数据
						var condition = {};
						if (info.opeType === 1) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition, {_id:0, t:0, f0: 0, f5:0, f6: 0}).toArray(function(error, values){
								if (error) {
									return callback(error);
								}else {
									for (var i = 0; i < values.length; i++) {
										var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, diamond: values[i].f4};
										results.push(data);
									}
									++start;
									cb(null, 'ok');
								}								
							})
						}
						else if (info.opeType === 2) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 142, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 3) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 4) {
							var condition = {f0: 116, f1:{$gte: info.startTime, $lt: info.endTime}, f5: info.typeValue.toString()};
							//var condition = {f0: 116, f1:{$gte: info.startTime, $lt: info.endTime}, '$or': [{ f5: "38" },{ f5: "108" }]};
							collection.find(condition, {_id:0, s:1, f1:1, f2:1, f5:1}).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, amount: values[i].f5};
									results.push(data);
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 5) {
							collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: {server: '$s', ope: '$f0', type: '$f3'}, total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i]._id.server, ope: values[i]._id.ope, type: getEventName(parseInt(values[i]._id.type)), amount: values[i].total, time: getDateTime(info.startTime)});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 6) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, amount: values[i].f4, diamond: values[i].f5});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 7) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								resValues = [];
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total)});
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": parseInt(values[i].total)*10});
                  					}
                  					else {
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"灵魂宝石", "gems": (((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total))});
                  					}
                				}
                				sortAndMergeData(resValues, results, "starLevel", function(error, results){
                					++start;
                					cb(null, 'ok');
                				})
							})
						}
						else if (info.opeType === 8) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total));
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", parseInt(values[i].total)*10);
                  					}
                  					else {
            							summationUpgradeStar(results, values[i]._id, values[i].total, "灵魂宝石", ((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total));
                  					}
                				}
                				results.sort(by("starLevel"));
                				++start;
                				cb(null, 'ok');
                				
							})
						}
						else if (info.opeType === 9){
							if (info.typeValue === 0){
								++start;
								cb(null, 'ok');
							}
							else {
								condition = {f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
								//console.log(condition);
								collection.find(condition).toArray(function(error, values){
									var diamond = amount = 0;
									for (var i = 0; i < values.length; i++) {
										amount += parseInt(values[i].f4);
										diamond += parseInt(values[i].f5);
									}
									results.push({"server": start, "time": getDateTimeRange(parseInt(info.startTime), parseInt(info.endTime)-1), "type": info.typeValue, "amount": amount, "diamond": diamond});
									++start;
									cb(null, 'ok');
								})
							}							
						}
						else if (info.opeType === 10) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$f3', total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, type: getEventName(values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 11) {
							var timestamp = getDateTime(info.startTime);
							var typeValue = (info.typeValue===0)?"false":"true";
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}, f4: typeValue}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total, win: typeValue};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 12) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30014: {$gt:0}}}, {$limit: 50}, {$group: {_id: '$f2', total: {$sum: '$30014'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 13) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30012: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$30012'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 14) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30013: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$30013'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 15) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1).toString();
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f5: {$gt:0}}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue, f5: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id+"\"", type: getEventName(info.typeValue), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 16){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1).toString();
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 17){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue}}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 18){
							if (info.typeValue === 0){
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}}).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).toArray(function(error, values){
									console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 19){
							if (info.typeValue != 0){
								collection.find({f0: 144, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, startLevel: values[i].f4, status: values[i].f5});
									}
									++start;
									cb(null, 'ok');
								})
							} else {
								++start;
								cb(null, 'ok');
							}
						}
						else {
							return callback(null, []);
						}
					});
				},
				function(error, result){
					mongo.simplified.close();
					callback(null, results);	
				}
			)
		});
	}
	if (info.platform === 2) {
		mongo.traditional.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}

			var results = [];
			var start = info.startServer;
			async.whilst(
				function(){ return start <= info.endServer; },
				function(cb){
					//读取collection集合
					db.collection("nba_ope_log_"+start, function (err, collection) {
						if (err) {
							mongo.traditional.close();
							return callback(err);//错误，返回 err 信息
						}
						//查找数据
						var condition = {};
						if (info.opeType === 1) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition, {_id:0, t:0, f0: 0, f5:0, f6: 0}).toArray(function(error, values){
								if (error) {
									return callback(error);
								}else {
									for (var i = 0; i < values.length; i++) {
										var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, diamond: values[i].f4};
										results.push(data);
									}
									++start;
									cb(null, 'ok');
								}								
							})
						}
						else if (info.opeType === 2) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 142, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 3) {
							var timestamp = getDateTime(info.startTime);
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								console.log(typeof(values));
								if (values === undefined){
									++start;
									cb(null, 'ok');
								}
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 4) {
							var condition = {f0: 116, f1:{$gte: info.startTime, $lt: info.endTime}, f5: info.typeValue.toString()};
							collection.find(condition, {_id:0, s:1, f1:1, f2:1, f5:1}).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									var data = {server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, amount: values[i].f5};
									results.push(data);
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 5) {
							collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: {server: '$s', ope: '$f0', type: '$f3'}, total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i]._id.server, ope: values[i]._id.ope, type: getEventName(parseInt(values[i]._id.type)), amount: values[i].total, time: getDateTime(info.startTime)});
								}
								++start;
								cb(null, 'ok');
							})

						}
						else if (info.opeType === 6) {
							if (info.typeValue === 0) {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime} }
							}
							else {
								condition = {s: start, f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
							}

							collection.find(condition).toArray(function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: values[i].s, time: getDateTime(parseInt(values[i].f1)), wuid: values[i].f2, type: values[i].f3, amount: values[i].f4, diamond: values[i].f5});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 7) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								resValues = [];
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total)});
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"祝福宝石", "gems": parseInt(values[i].total)*10});
                  					}
                  					else {
            							resValues.push({"server": start, "starLevel":values[i]._id, "amount": parseInt(values[i].total), "name":"灵魂宝石", "gems": (((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total))});
                  					}
                				}
                				sortAndMergeData(resValues, results, "starLevel", function(error, results){
                					++start;
                					cb(null, 'ok');
                				})
							})
						}
						else if (info.opeType === 8) {
							collection.aggregate([{$match:{f0:144, f1: {$gte:info.startTime, $lt:info.endTime}}}, {$group: {_id: '$f4', total:{$sum: 1}}}], function(error, values){
								for (var i=0; i<values.length; ++i){
                  					if (parseInt(values[i]._id) <= 3){
            							summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", Math.pow(2, parseInt(values[i]._id))*parseInt(values[i].total));
                  					}
                  					else if (parseInt(values[i]._id) === 4){
                  						summationUpgradeStar(results, values[i]._id, values[i].total, "祝福宝石", parseInt(values[i].total)*10);
                  					}
                  					else {
            							summationUpgradeStar(results, values[i]._id, values[i].total, "灵魂宝石", ((parseInt(values[i]._id)-3)*2)*parseInt(values[i].total));
                  					}
                				}
                				results.sort(by("starLevel"));
                				++start;
                				cb(null, 'ok');
                				
							})
						}
						else if (info.opeType === 9){
							if (info.typeValue === 0){
								++start;
								cb(null, 'ok');
							}
							else {
								condition = {f0: 106, f1:{$gte: info.startTime, $lt: info.endTime}, f3: parseInt(info.typeValue) }
								collection.find(condition).toArray(function(error, values){
									var diamond = amount = 0;
									for (var i = 0; i < values.length; i++) {
										amount += parseInt(values[i].f4);
										diamond += parseInt(values[i].f5);
									}
									results.push({"server": start, "time": getDateTimeRange(parseInt(info.startTime), parseInt(info.endTime)-1), "type": info.typeValue, "amount": amount, "diamond": diamond});
									++start;
									cb(null, 'ok');
								})
							}							
						}
						else if (info.opeType === 10) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30004:{$gt:0}}}, {$group: {_id: '$f3', total: {$sum: '$30004'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, type: getEventName(values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 11) {
							var timestamp = getDateTime(info.startTime);
							var typeValue = (info.typeValue===0)?"false":"true";
							collection.aggregate([{$match: {s:start, f0: 140, f1: {$gte: info.startTime, $lt: info.endTime}, f4: typeValue}}, {$group: {_id: {server: '$s', wuid: '$f2'}, total:{$sum: 1}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									if (values[i].total >= info.typeValue){
										var data = {server: values[i]._id.server, time:timestamp, wuid: values[i]._id.wuid, amount: values[i].total, win: typeValue};
										results.push(data);
									}
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 12) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30014: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$30014'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 13) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30012: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$30012'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 14) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							collection.aggregate([{$match: {f0: 136, f1:{$gte: info.startTime, $lt: info.endTime}, 30013: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$30013'}}}], function(error, values){
								for (var i = 0; i < values.length; i++) {
									results.push({server: start, date: dateTime, wuid: (values[i]._id), diamond: values[i].total});
								}
								++start;
								cb(null, 'ok');
							})
						}
						else if (info.opeType === 15) {
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1).toString();
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f5: {$gt:0}}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 107, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue, f5: {$gt:0}}}, {$group: {_id: '$f2', total: {$sum: '$f5'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id+"\"", type: getEventName(info.typeValue), gold: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 16){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1).toString();
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 121, f1:{$gte: info.startTime, $lt: info.endTime}, f3: info.typeValue}}, {$group: {_id: {type: '$f3', wuid: '$f2'}, total: {$sum: '$30004'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: getEventName(values[i]._id.type), diamond: values[i].total});	
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 17){
							var dateTime = getDateTimeRange(info.startTime, info.endTime-1);
							if (info.typeValue === 0){
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.aggregate([{$match: {f0: 110, f1:{$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue}}, {$group: {_id: {wuid: '$f2', type: '$f3'}, total: {$sum: '$f4'}}}], function(error, values){
									//console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: dateTime, wuid: "=\""+values[i]._id.wuid+"\"", type: values[i]._id.type, diamond: values[i].total});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 18){
							if (info.typeValue === 0){
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}}).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
							else {
								collection.find({f0: 126, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).toArray(function(error, values){
									console.log(values);
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, level: values[i].f4});
									}
									++start;
									cb(null, 'ok');
								})
							}
						}
						else if (info.opeType === 19){
							if (info.typeValue != 0){
								collection.find({f0: 144, f1: {$gte: info.startTime, $lt: info.endTime}, f4: info.typeValue.toString()}).toArray(function(error, values){
									for (var i = 0; i < values.length; i++) {
										results.push({server: start, date: getDateTime(values[i].f1), wuid: "=\""+values[i].f2+"\"", cardId: values[i].f3, startLevel: values[i].f4, status: values[i].f5});
									}
									++start;
									cb(null, 'ok');
								})
							} else {
								++start;
								cb(null, 'ok');
							}
						}
						else {
							return callback(null, []);
						}
					});
				},
				function(error, result){
					mongo.traditional.close();
					callback(null, results);	
				}
			)
		});
	}
	else{
		callback(1);
	}
}


Statistical.queryUsersLoginData = function(info, callback){
	if (info.platform === 1){
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}
	
			var results = [];
			db.collection("nba_login_log", function(error, collection){
				var start = info.startServer;
				async.whilst(
					function(){return start <= info.endServer; },
					function(cb){
						collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							var data = {server: start, number: values.length, date: getDateTime(info.startTime)};
							results.push(data);
							++start;
							cb(null, 'ok');
						});
					},
					function(error, result){
						db.close();
						return callback(null, results);
					}
				)
			})
		})
	} else {
		mongo.traditional.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回 err 信息
            }

            var results = [];
            db.collection("nba_login_log", function(error, collection){
                var start = info.startServer;
                async.whilst(
                    function(){return start <= info.endServer; },
                    function(cb){
                        collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							var data = {server: start, number: values.length, date: getDateTime(info.startTime)};
							results.push(data);
							++start;
							cb(null, 'ok');
						});
                    },
                    function(error, result){
                        db.close();
                        return callback(null, results);
                    }
                )
            })
        })	
	}
}

Statistical.queryUsersLoginDataDetail = function(info, callback){
	if (info.platform === 1){
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}
	
			var results = [];
			db.collection("nba_login_log", function(error, collection){
				var start = info.startServer;
				async.whilst(
					function(){return start <= info.endServer; },
					function(cb){
						collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							for (var i = 0; i < values.length; i++) {
								var data = {server: start, wuid: values[i]._id, times: values[i].total, date: getDateTimeRange(info.startTime, info.endTime)};
								results.push(data);
							};

							++start;
							cb(null, 'ok');
						});
					},
					function(error, result){
						db.close();
						return callback(null, results);
					}
				)
			})
		})
	} else {
		mongo.traditional.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回 err 信息
            }

            var results = [];
            db.collection("nba_login_log", function(error, collection){
                var start = info.startServer;
                async.whilst(
                    function(){return start <= info.endServer; },
                    function(cb){
                        collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$limit: 50}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							//console.log(values);
							for (var i = 0; i < values.length; i++) {
								var data = {server: start, wuid: values[i]._id, times: values[i].total, date: getDateTimeRange(info.startTime, info.endTime)};
								results.push(data);
							};
							++start;
							cb(null, 'ok');
						});
                    },
                    function(error, result){
                        db.close();
                        return callback(null, results);
                    }
                )
            })
        })	
	}
}

Statistical.queryUsersRechargeData = function(info, callback){
	var results = [];
	if (info.platform === 1){
		MongoClient.connect("mongodb://" + settings.server.simplified_backup.host + ':' + settings.server.simplified_backup.port + '/' + getDbName(), function(err, getdb){
			getdb.collection('recharge_history', function(error, coll){
				if (!error){
					coll.find({worldId: {$gte: info.startServer, $lte: info.endServer}, createTime: {$gte: info.startTime, $lt: info.endTime}}, {wuid:1, worldId:1, item:1, createTime:1}).toArray(function(error, values){
						for (var i=0; i< values.length; ++i){
							if (values[i].item){
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: values[i].item[0], diamond:values[i].item[3], date: getDateTime(values[i].createTime)});
							}
							else {
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: 0, diamond: 0, date: getDateTime(values[i].createTime)});
							}
						}
						return callback(null, results);
					})
				}
				else {
					callback(error)
				}
			})
		})
	} else {
		MongoClient.connect("mongodb://" + settings.server.traditional_backup.host + ':' + settings.server.traditional_backup.port + '/' + getDbName(), function(err, getdb){
			getdb.collection('recharge_history', function(error, coll){
				if (!error){
					coll.find({worldId: {$gte: info.startServer, $lte: info.endServer}, createTime: {$gte: info.startTime, $lt: info.endTime}}, {wuid:1, worldId:1, item:1, createTime:1}).toArray(function(error, values){
						for (var i=0; i< values.length; ++i){
							if (values[i].item){
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: values[i].item[0], diamond:values[i].item[3], date: getDateTime(values[i].createTime)});
							}
							else {
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: 0, diamond: 0, date: getDateTime(values[i].createTime)});
							}
						}
						return callback(null, results);
					})
				}
				else {
					callback(error)
				}
			})
		})
	}
}

Statistical.exportUsersLoginData = function(info, callback){
	//console.log(info);
	if (info.platform === 1){
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}

			var results = [];
			db.collection("nba_login_log", function(error, collection){
				var start = info.startServer;
				async.whilst(
					function(){return start <= info.endServer; },
					function(cb){
						collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							var data = {server: start, number: values.length, date: getDateTime(info.startTime)};
							//console.log(data);
							results.push(data);
							++start;
							cb(null, 'ok');
						});
					},
					function(error, result){
						//console.log("here");
						db.close();
						return callback(null, results);
					}
				)
			})
		})
	} else {
		mongo.traditional.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回 err 信息
            }

            var results = [];
            db.collection("nba_login_log", function(error, collection){
                var start = info.startServer;
                async.whilst(
                    function(){return start <= info.endServer; },
                    function(cb){
                        collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							var data = {server: start, number: values.length, date: getDateTime(info.startTime)};
							results.push(data);
							++start;
							cb(null, 'ok');
						});
                    },
                    function(error, result){
                        db.close();
                        return callback(null, results);
                    }
                )
            })
        })
	}
}


Statistical.exportUsersRechargeData = function(info, callback){
	var results = [];
	if (info.platform === 1){
		MongoClient.connect("mongodb://" + settings.server.simplified_backup.host + ':' + settings.server.simplified_backup.port + '/' + getDbName(), function(err, getdb){
			getdb.collection('recharge_history', function(error, coll){
				if (!error){
					coll.find({worldId: {$gte: info.startServer, $lte: info.endServer}, createTime: {$gte: info.startTime, $lt: info.endTime}}, {wuid:1, worldId:1, item:1, createTime:1}).toArray(function(error, values){
						for (var i=0; i< values.length; ++i){
							if (values[i].item){
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: values[i].item[0], diamond:values[i].item[3], date: getDateTime(values[i].createTime)});
							}
							else {
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: 0, diamond: 0, date: getDateTime(values[i].createTime)});
							}
						}
						return callback(null, results);
					})
				}
				else {
					callback(error)
				}
			})
		})
	} else {
		MongoClient.connect("mongodb://" + settings.server.traditional_backup.host + ':' + settings.server.traditional_backup.port + '/' + getDbName(), function(err, getdb){
			getdb.collection('recharge_history', function(error, coll){
				if (!error){
					coll.find({worldId: {$gte: info.startServer, $lte: info.endServer}, createTime: {$gte: info.startTime, $lt: info.endTime}}, {wuid:1, worldId:1, item:1, createTime:1}).toArray(function(error, values){
						for (var i=0; i< values.length; ++i){
							if (values[i].item){
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: values[i].item[0], diamond:values[i].item[3], date: getDateTime(values[i].createTime)});
							}
							else {
								results.push({server: values[i].worldId, wuid: values[i].wuid, recharge: 0, diamond: 0, date: getDateTime(values[i].createTime)});
							}
						}
						return callback(null, results);
					})
				}
				else {
					callback(error)
				}
			})
		})
	}
}

Statistical.exportUsersLoginDataDetail = function(info, callback){
	if (info.platform === 1){
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}
	
			var results = [];
			db.collection("nba_login_log", function(error, collection){
				var start = info.startServer;
				async.whilst(
					function(){return start <= info.endServer; },
					function(cb){
						collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							for (var i = 0; i < values.length; i++) {
								var data = {server: start, wuid: "=\""+values[i]._id+"\"", times: values[i].total, date: getDateTimeRange(info.startTime, info.endTime)};
								results.push(data);
							};

							++start;
							cb(null, 'ok');
						});
					},
					function(error, result){
						db.close();
						return callback(null, results);
					}
				)
			})
		})
	} else {
		mongo.traditional.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回 err 信息
            }

            var results = [];
            db.collection("nba_login_log", function(error, collection){
                var start = info.startServer;
                async.whilst(
                    function(){return start <= info.endServer; },
                    function(cb){
                        collection.aggregate([{$match: {s: start, time: {$gte: info.startTime, $lt: info.endTime}}}, {$group: {_id: '$wuid', total: {$sum: 1}}}], function(error, values){
							for (var i = 0; i < values.length; i++) {
								var data = {server: start, wuid: "=\""+values[i]._id+"\"", times: values[i].total, date: getDateTimeRange(info.startTime, info.endTime)};
								results.push(data);
							};
							++start;
							cb(null, 'ok');
						});
                    },
                    function(error, result){
                        db.close();
                        return callback(null, results);
                    }
                )
            })
        })	
	}
}


function getDateTime(time){
	var timestamp = new Date(parseInt(time)*1000);
	return timestamp.getFullYear()+"-"+(timestamp.getMonth()+1)+"-"+timestamp.getDate()+" "+timestamp.getHours()+":"+timestamp.getMinutes()+":"+timestamp.getSeconds();
}


function getStartTimestamp(time){
	var str = time.toString()+" 00:00:00";
	return new Date(str).getTime()/1000;
}

function getEndTimestamp(time){
	var str = time.toString()+" 23:59:59";
	return (new Date(str).getTime()/1000)+1;
}

function getEventName(type){
	var name = eventType[type];
	if (name  === undefined){
        return type;
    }   
    else {
        return name;
    }
}

function getDateTimeRange(start, end){
	var startTime = new Date(parseInt(start)*1000);
	var endTime = new Date(parseInt(end)*1000);

	return startTime.getFullYear()+"/"+(startTime.getMonth()+1)+"/"+startTime.getDate()+"<-->"+endTime.getFullYear()+"/"+(endTime.getMonth()+1)+"/"+endTime.getDate()
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

function sortAndMergeData(values, results, key, callback){
	values.sort(by(key));
	for (var i = 0; i < values.length; i++) {
		results.push(values[i]);
	}
	callback(null, results);
}

function summationUpgradeStar(results, starLevel, amount, name, gems){
	var index = -1;
	for (var i = 0; i < results.length; i++) {
		if (results[i].starLevel === starLevel){
			index = i;
		}
	}
	if (index === -1){
		results.push({"starLevel": starLevel, "amount": amount, "name": name, "gems": gems})
	}
	else {
		results[index].amount += amount;
		results[index].gems += gems;
	}
	return results;
}

function getVipInfoFilename(timestamp){
	var date_time_ = new Date(parseInt(timestamp)*1000);
	return (date_time_.getFullYear()*10000+(date_time_.getMonth()+1)*100+date_time_.getDate()).toString()+"_simple_day_vip.csv";
}

function getDbName(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
}







