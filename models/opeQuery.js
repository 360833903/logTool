var fs = require('fs');

var mongo = require('./mongoConfig');
var Collection = require('mongodb').Collection;
var CardList = require('../public/javascripts/cardList').CardList;
var EquipList = require('../public/javascripts/equip_list').data;
var itemValue = require('../public/javascripts/itemValue').ItemValue;
var eventType = require('../public/javascripts/eventType').EventType;
var cardAttribute = require('./card_attribute_list').data;

module.exports = opeQuery;

function opeQuery(info) {
  this.platform = parseInt(info.platform);
  this.opeType = parseInt(info.opeType);
  this.startTime = getStartTimestamp(info.startTime);
  this.endTime = getEndTimestamp(info.endTime);
  this.wuid = parseInt(info.wuid);
  this.itemType = info.itemType;
  this.server = parseInt(info.server);
};

opeQuery.queryUserData = function(info, callback){
	//console.log(info);
	if (info.platform === 1) {
		mongo.simplified.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}
			//读取collection集合
			db.collection("nba_ope_log_"+info.server.toString(), function (err, collection) {
				if (err) {
					mongo.simplified.close();
					return callback(err);//错误，返回 err 信息
				}
				//查找数据
				var condition = {};
				if (info.opeType === 1) {
					if (info.itemType === 0){
						condition = {f0: 110, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}
					else {
						condition = {f0: 110, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType)};
					}

					//console.log(condition);
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
					//	console.log(values);
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								//console.log(parseInt(values[i].f1));
								values[i].f1 = getDateTime(parseInt(values[i].f1));
								if (parseInt(values[i].f6) < 0){
									values[i].f6 = "获得: "+parseInt(values[i].f6)*-1;
								}
								else {
									values[i].f6 = "人品爆发: "+values[i].f6;
								}
							}
							return callback(null, values);
						}
					})

				}
				else if (info.opeType === 2) {
					//天梯赛
					condition = {f0: 142, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 3) {
					condition = {f0: 140, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 4) {
					condition = {'$or': [{ f0: 136 },{ f0: 137 }], f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0, f0:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							var results = new Array();
							for (var i = 0; i < values.length; i++) {
								value = {}
								if (info.itemType === 0){
									for (var name in values[i]) {
										if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
											value['data'] = getSendIData(name, values[i][name], value['data']);
										}
										else if (name === 'f5'){
											value['data'] = "钻石: "+values[i]['f5'];
										}
										else {
											value['time'] = getDateTime(parseInt(values[i]['f1']));
											value['wuid'] = values[i]['f2'];
											value['type'] = getEventName(values[i]['f3']);
										}
									}
									if (value != null && value['data'] != undefined){
										results.push(value);
									}
								}
								else {
									if (values[i].hasOwnProperty(info.itemType.toString())){
										for (var name in values[i]) {
											if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
												value['data'] = getSendIData(name, values[i][name], value['data']);
											}
											else {
												value['time'] = getDateTime(parseInt(values[i]['f1']));
												value['wuid'] = values[i]['f2'];
												value['type'] = getEventName(values[i]['f3']);
											}
										}
										if (value != null  && value['data'] != undefined){
											results.push(value);
										}
									}
								}
							}
							return callback(null, results);
						}
					})
				}
				else if (info.opeType === 5) {
					//
					condition = {f0: 144, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
								values[i].f3 = getCardName(parseInt(values[i].f3))+"("+parseInt(values[i].f3)+")";
								values[i].f6 = (parseInt(values[i].f6)===0)?"否":"是";
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 6){
					//等级礼包
					condition = {f0: 129, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 7){
					//好友邀请码
					condition = {f0: 148, f4: info.itemType.toString()};

					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 8){
					condition = {f0: 103, f1: {$gte: info.startTime, $lte: info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.simplified.close();
						if (error){
							return callback(error);
						}
						else {
							var results = [];
							for (var i = 0; i < values.length; i++) {
								if (values[i].f4 != undefined){
									if (parseInt(values[i].f3) === 0){
										results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "培养", f4: "特训卡X"+values[i].f4});
									}
									else {
										if (parseInt(values[i].f4) === 10){
											results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "高级培养", f4: "特训卡X1 钻石: "+values[i].f4});	
										}
										else {
											results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "高级培养", f4: "特训卡X10 钻石: "+values[i].f4});	
										}
									}

								}
							};
						}
						callback(null, results);	
					})
				}
				else if (info.opeType === 9){
					condition = {f0: 136, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3:404};
					collection.find(condition, {_id: 0, f0:0, f4:0, s: 0, t:0}).toArray(function(error, values){
						var results = new Array();
						mongo.simplified.close();
						if (error){
							return callback(error);
						}
						else {
							
							for (var i = 0; i < values.length; i++) {
								var value = {};

								for (var name in values[i]) {
    								if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
										value['data'] = getSendIData(name, values[i][name], value['data']);
    								}   
    								else {
										value['time'] = getDateTime(parseInt(values[i]['f1']));
										value['wuid'] = values[i]['f2'];
										value['type'] = getEventName(values[i]['f3']);
									}   
								}   
								if (value != null  && value['data'] != undefined){
									results.push(value);
								}
							};
						}
						callback(null, results);
					})
				}
				else if (info.opeType === 10){
					var condition = {f0: 152, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};

					//console.log(condition);
					collection.find(condition).toArray(function(error, values){
						var results = new Array();
						mongo.simplified.close();
						if (error){
							return callback(error);
						}
						else {
							for (var i = 0; i < values.length; i++) {
								if (values[i].other){
									results.push({wuid: values[i].f2, time: getDateTime(values[i].f1), equipId: JSON.parse(values[i].other.slice(0, -1)).i, equipName: getEquipName(JSON.parse(values[i].other.slice(0, -1)).i)});
								}								
							}
						}

						return callback(null, results);
					})
				}
				else if (info.opeType === 11){
					var condition = {};
					if (info.itemType === 0){
						condition = {f0:121, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, 30004: {$gte: 0}};
					}else {
						condition = {f0:121, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType), 30004: {$gte: 0}};
					}
					
					collection.find(condition).toArray(function(error, values){
						var results = [];
						mongo.simplified.close();
						if (error){
							return callback(error);
						} else {
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, eventID: getEventName(values[i].f3), diamond: values[i]['30004']});
							};
						}
						return callback(null, results);
					})
				}
				else if (info.opeType === 12){
					var condition = {};
					if (info.itemType === 0){
						condition = {f0:124, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:124, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType)};
					}

					collection.find(condition).toArray(function(error, values){
						var results = [];
						mongo.simplified.close();
						if (error){
							return callback(error);
						} else {
							//console.log(condition, values.length);
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, gold: values[i].f4, before: values[i].f5, after: values[i].f6});
							};
						}
						//console.log(results.length);
						return callback(null, results);
					})
				}
				else if (info.opeType === 13){
					var condition = {}, results = [];
					if (info.itemType === 0){
						condition = {f0:106, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:106, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: info.itemType};
					}
					collection.find(condition).toArray(function(error, values){
						mongo.simplified.close();
						if (error){
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, diamond: values[i].f5});
							};
						}
						return callback(null, results);
					})
				}
				else if (info.opeType === 14){
					var condition = {}, results = [];
					if (info.itemType === 0){
						condition = {f0:107, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:107, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: info.itemType};
					}
					collection.find(condition).toArray(function(error, values){
						mongo.simplified.close();
						if (error){
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, gold: values[i].f5});
							};
						}
						return callback(null, results);
					})
				}
				else if (info.opeType === 15){
					var results = [];
					collection.find({f0: 153, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid}).toArray(function(error, values){
						mongo.simplified.close();
						if (error){
							return callback(error);
						} else {
							for (var i = 0; i < values.length; i++) {
								var AttType = (values[i].f4 === '1') ? "基本属性": ((values[i].f4 === '2') ? "扩展属性": '0');
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, lock: values[i].f3, type: AttType, newA: getHBXialian(JSON.parse(values[i]['new'])), oldA: getHBXialian(JSON.parse(values[i]['old']))});
							}
							console.log("*********\t", results);
							return callback(null, results);
						}
					})
				}
				else {
					return callback(null, []);
				}
			});
		});
	}
	else if (info.platform === 2) {
		mongo.traditional.open(function (err, db) {
			if (err) {
				return callback(err);//错误，返回 err 信息
			}
			//读取collection集合
			db.collection("nba_ope_log_"+info.server.toString(), function (err, collection) {
				if (err) {
					mongo.traditional.close();
					return callback(err);//错误，返回 err 信息
				}
				//查找数据
				var condition = {};
				if (info.opeType === 1) {
					if (info.itemType === 0){
						condition = {f0: 110, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}
					else {
						condition = {f0: 110, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType)};
					}

					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
								if (parseInt(values[i].f6) < 0){
									values[i].f6 = "获得: "+parseInt(values[i].f6)*-1;
								}
								else {
									values[i].f6 = "人品爆发: "+values[i].f6;
								}
							}
							return callback(null, values);
						}
					})

				}
				else if (info.opeType === 2) {
					condition = {f0: 142, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 3) {
					condition = {f0: 140, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 4) {
					condition = {'$or': [{ f0: 136 },{ f0: 137 }], f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0, f0:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							var results = new Array();
							for (var i = 0; i < values.length; i++) {
								value = {}
								if (info.itemType === 0){
									for (var name in values[i]) {
										if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
											value['data'] = getSendIData(name, values[i][name], value['data']);
										}
										else if (name === 'f5'){
											value['data'] = "钻石: "+values[i]['f5'];
										}
										else {
											value['time'] = getDateTime(parseInt(values[i]['f1']));
											value['wuid'] = values[i]['f2'];
											value['type'] = getEventName(values[i]['f3']);
										}
									}
									if (value != null  && value['data'] != undefined){
										results.push(value);
									}
								}
								else {
									if (values[i].hasOwnProperty(info.itemType.toString())){
										for (var name in values[i]) {
											if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
												value['data'] = getSendIData(name, values[i][name], value['data']);
											}
											else {
												value['time'] = getDateTime(parseInt(values[i]['f1']));
												value['wuid'] = values[i]['f2'];
												value['type'] = getEventName(values[i]['f3']);
											}
										}
										if (value != null  && value['data'] != undefined){
											results.push(value);
										}
									}
								}						
							}
							return callback(null, results);
						}
					})
				}
				else if (info.opeType === 5) {
					condition = {f0: 144, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
								values[i].f3 = getCardName(parseInt(values[i].f3))+"("+parseInt(values[i].f3)+")";
								values[i].f6 = (parseInt(values[i].f6)===0)?"否":"是";
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 6){
					//等级礼包
					condition = {f0: 129, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 7){
					//等级礼包
					condition = {f0: 148, f4: info.itemType.toString()};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error) {
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								values[i].f1 = getDateTime(parseInt(values[i].f1));
							}
							return callback(null, values);
						}
					})
				}
				else if (info.opeType === 8){
					condition = {f0: 103, f1: {$gte: info.startTime, $lte: info.endTime}, f2: info.wuid};
					collection.find(condition, {_id:0, s:0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error){
							return callback(error);
						}
						else {
							var results = [];
							for (var i = 0; i < values.length; i++) {
								if (values[i].f4 != undefined){
									if (parseInt(values[i].f3) === 0){
										results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "培养", f4: "特训卡X"+values[i].f4});
									}
									else {
										if (parseInt(values[i].f4) === 10){
											results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "高级培养", f4: "特训卡X1 钻石: "+values[i].f4});	
										}
										else {
											results.push({f1: getDateTime(parseInt(values[i].f1)), f2: values[i].f2, f3: "高级培养", f4: "特训卡X10 钻石: "+values[i].f4});	
										}
									}

								}
							};
						}
						callback(null, results);	
					})
				}
				else if (info.opeType === 9){
					condition = {f0: 136, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3:404};
					collection.find(condition, {_id: 0, f4:0, s: 0, t:0}).toArray(function(error, values){
						mongo.traditional.close();
						if (error){
							return callback(error);
						}
						else {
							var results = new Array();
							for (var i = 0; i < values.length; i++) {
								var value = {};
								for (var name in values[i]) {
                                    if (name != 'f1' && name != 'f2' && name != 'f3' && name != 'f4' && name != 'f0'){
                                        value['data'] = getSendIData(name, values[i][name], value['data']);
                                    }
                                    else {
                                        value['time'] = getDateTime(parseInt(values[i]['f1']));
                                        value['wuid'] = values[i]['f2'];
                                        value['type'] = getEventName(values[i]['f3']);
                                    }
                                }
                                if (value != null  && value['data'] != undefined){
                                    results.push(value);
                                }
							};
						}
						callback(null, results);
					})
				}
				else if (info.opeType === 10){
					var condition = {f0: 152, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};

					collection.find(condition).toArray(function(error, values){
						var results = new Array();
						mongo.traditional.close();
						if (error){
							return callback(error);
						}
						else {
							for (var i = 0; i < values.length; i++) {
								if (values[i].other){
									results.push({wuid: values[i].f2, time: getDateTime(values[i].f1), equipId: JSON.parse(values[i].other.slice(0, -1)).i, equipName: getEquipName(JSON.parse(values[i].other.slice(0, -1)).i)});
								}								
							}
						}

						return callback(null, results);
					})
				}
				else if (info.opeType === 11){
					var condition = {};
					if (info.itemType === 0){
						condition = {f0:121, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, 30004: {$gte: 0}};
					}else {
						condition = {f0:121, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType), 30004: {$gte: 0}};
					}
					
					collection.find(condition).toArray(function(error, values){
						var results = [];
						mongo.traditional.close();
						if (error){
							return callback(error);
						} else {
							//console.log(values.length);
							for (var i = 0; i < values.length; i++) {
								results.push({wuid: values[i].f2, date: getDateTime(values[i].f1), eventID: getEventName(values[i].f3), diamond: values[i]['30004']});
							};
						}
						//console.log(results.length);
						return callback(null, results);
					})
				}
				else if (info.opeType === 12){
					var condition = {};
					if (info.itemType === 0){
						condition = {f0:124, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:124, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: parseInt(info.itemType)};
					}

					collection.find(condition).toArray(function(error, values){
						var results = [];
						mongo.traditional.close();
						if (error){
							return callback(error);
						} else {
							//console.log(condition, values.length);
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, gold: values[i].f4, before: values[i].f5, after: values[i].f6});
							};
						}
						//console.log(results.length);
						return callback(null, results);
					})
				}
				else if (info.opeType === 13){
					var condition = {}, results = [];
					if (info.itemType === 0){
						condition = {f0:106, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:106, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: info.itemType};
					}
					collection.find(condition).toArray(function(error, values){
						mongo.traditional.close();
						if (error){
							return callback(error);
						}else {
							//console.log(values, condition);
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, diamond: values[i].f5});
							};
						}
						return callback(null, results);
					})
				}
				else if (info.opeType === 14){
					var condition = {}, results = [];
					if (info.itemType === 0){
						condition = {f0:107, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid};
					}else {
						condition = {f0:107, f1:{$gte:info.startTime, $lte:info.endTime}, f2: info.wuid, f3: info.itemType};
					}
					collection.find(condition).toArray(function(error, values){
						mongo.traditional.close();
						if (error){
							return callback(error);
						}else {
							for (var i = 0; i < values.length; i++) {
								results.push({date: getDateTime(values[i].f1), wuid: values[i].f2, itemID: values[i].f3, gold: values[i].f5});
							};
						}
						return callback(null, results);
					})
				}
				else {
					return callback(null, []);
				}

			});
		});
	}
	else{
		callback(1);
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
	return new Date(str).getTime()/1000;
}

function getCardName(_id){
	var name = CardList[_id];
	if (name  == undefined){
        return _id.toString();
    }   
    else {
        return name;
    }
}

function getSendData(key, value, data){
    var name = itemValue[key];
    if (name  == undefined){
    	if (data === undefined) {
    		return key.toString()+":"+value.toString();
    	}
    	else {
    		return data+","+key.toString()+":"+value.toString();	
    	}        
    }   
    else {
    	if (data === undefined){
    		return name.toString()+":"+value.toString();
    	}
    	else {
    		return data+","+name.toString()+":"+value.toString();
    	}
        
    }
}

function getSendIData(key, value, data){
    var name = itemValue[key];
	//console.log(key, value, data);
	if (key.search('f') === -1){
	    if (name  == undefined){
   	    	if (data === undefined) {
            	return key.toString()+":"+value.toString();
        	}   
        	else {
            	return data+","+key.toString()+":"+value.toString();    
        	}    
    	}   
    	else {
        	if (data === undefined){
            	return name.toString()+":"+value.toString();
        	}   
        	else {
            	return data+","+name.toString()+":"+value.toString();
        	}   
   		}   
	}
}

function getEventName(type){
	var name = eventType[type];
	if (name  == undefined){
        return type;
    }   
    else {
        return name;
    }
}

function getEquipName(_id){
	for (var i = 0; i < EquipList.length; i++) {
        if (EquipList[i]._id === _id){ 
            return EquipList[i].n;
        }          
    }   
    return _id.toString();
}

function getHBXialian(values){
	var str = '';
	if (values){
		if (values[0].i != 48){
			str += getCardAttribute(values[0].i)+"增加"+values[0]['a'][0]+", "
		}
		if (values[0].i === 48){
			str += "球员卡"+values[0]['a'][0]+"的技能等级增加"+values[0]['a'][1]+", "
		}
		if (values[1].i != 48){
			str += getCardAttribute(values[1].i)+"增加"+values[1]['a'][0]
		}
		if (values[1].i === 48){
			str += "球员卡"+values[1]['a'][0]+"的技能等级增加"+values[1]['a'][1]
		}
	}
	return str;
}

function getCardAttribute(id){
	for (var i = 0; i < cardAttribute.length; i++) {
		if (cardAttribute[i]._id === id){
			return cardAttribute[i].n;
		}
	}
	return id.toString();
}












