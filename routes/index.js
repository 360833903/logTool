
/*
 * GET home page.
 */
var async = require('async');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var csv = require('express-csv');

var settings = require('../settings');
var opeStatisticalDB = require('../models/opeStatistical');
var opeQueryDB = require('../models/opeQuery');
var execJS = require('../models/execJS');
var gameGiftpackBuy = require('../models/gameGiftpackBuy');
var showLogFile = require('../models/showLogFile');
var dailyStatistics = require('../models/opeDailyStatistics.js');

var exec = require('child_process').exec;

var ENTRIES_PER_PAGE = 30;

function formatDate(stamp) {
	var date = new Date(stamp * 1000);
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	month = month < 10 ? '0' + month : month;
	var day = date.getDate();
	day = day < 10 ? '0' + day : day;

	var hour = date.getHours();
	hour = hour < 10? '0' + hour: hour;
	var minut = date.getMinutes();
	minut = minut < 10? '0' + minut: minut;
	var sec = date.getSeconds();
	sec = sec < 10? '0' + sec: sec;

	return year + '/' + month + '/' + day + ' ' + hour + ':' + minut + ':' + sec;
};

var contains = function(ele, array) {
	for (var key in array)
		if (array[key] == ele)
			return true;
	return false;
};

function getD(d) {
	var myDate = new Date();

	myDate.setDate(myDate.getDate()-d);

	return myDate.getFullYear()+""+(myDate.getMonth()+1)+""+myDate.getDate();
}

module.exports = function(app) {
	var db_cn, db_tw;

	MongoClient.connect("mongodb://" + settings.server.simplified.host.toString() + ':' + settings.server.simplified.port.toString() + '/' + settings.server.simplified.db, function(err, getdb){
		if (err)
			return console.log(err);
		db_cn = getdb;
	});

	MongoClient.connect("mongodb://" + settings.server.traditional.host + ':' + settings.server.traditional.port + '/' + settings.server.traditional.db, function(err, getdb){
		if (err)
			return console.log(err);
		db_tw = getdb;
	});

        app.get('/liansai_paiming/', function(req, res){
		var MAX_w = 40;

        var world = req.query.world;
		var w = req.query.w;
		var l = req.query.l;
		var r = parseInt(req.query.r);
		var d = req.query.d;
		if(!world || !d) return res.render('liansai_paiming');
		d=d.replace(/-/g,'');
		
		//w = w.split(',');
		if(!w){
			w=[];
			for(i=1;i<=MAX_w;i++){
				w[i-1] = i;
			}
		}else{
			w = w.split(',');
			for(k in w){
				w[k] = parseInt(w[k]);
			}
		}
		if(!l) l = 'S,A,B,C';
		
		var l_filter = [];
		if(l.indexOf('S') > -1) l_filter.push([0,3]);
		if(l.indexOf('A') > -1) l_filter.push([4,19]);
		if(l.indexOf('B') > -1) l_filter.push([20,83]);
		if(l.indexOf('C') > -1) l_filter.push([84,339]);
		
		if(!r) r = 8;
		var db_host, db_port;
                if(world==1){
                        db_host = settings.server.simplified_backup.host;
                        db_port = settings.server.simplified_backup.port;
                }else{
                        db_host = settings.server.traditional.host;
                        db_port = settings.server.traditional.port;
                }
		var db_name = 'game_db';
                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + (db_name+d), function(err, getdb){
                        if (err)
                                res.end(err);
                        db = getdb;
                        var csv = require('express-csv');
                        var temp = [['wuid', '区id', '组id', '球队名', '积分', '计算今天第一场连胜', '战力']];
			
			var x = 0;
			async.whilst(
				function(){return x < w.length;},
				function(cb1) {
					var y = 0;
					async.whilst(
						function(){return y < l_filter.length;},
						function(cb2){
							var start = l_filter[y][0];
							var end = l_filter[y][1];
							async.whilst(
								function(){return start <= end},
								function(cb3) {	
									db.collection('nba_pvp_liansai_team', function(err, c){
										if(err){
											res.end(err);
										}
										c.find({w:w[x],g:start,s:0},{_id:1,w:1,g:1,n:1,p:1,ww1:1,sc:1}).limit(r).sort({"p":-1,"ww1":-1,"sc":-1}).toArray(function(err,docs){
											if(docs)
												docs.forEach(function(elem){
													temp.push(['="'+elem._id+'"',elem.w,elem.g,elem.n,elem.p,elem.ww1,elem.sc]);
												});
											if(docs.length==0)
												console.log(JSON.stringify({w:w[x],g:start,s:0}));
											start++;
											cb3(null,'ok');
										});
									});
								},
								function(err,result){
       			                                                y++;
                        		                                cb2(null,'ok');
 
								}
							);
						},
						function(err,result){
 		                                       x++;
                		                       cb1(null,'ok');
 
						}
					);
				},
				function(err,result){
					res.set("Content-Type", "charset=GB18030");
					res.set("content-disposition", "attachment; filename=liansai_paiming_"+req.query.w+"_"+l+"_"+r+".csv");
					res.csv(temp);
				}
			);
                });

        });


	app.get('/lowbits/', function(req, res) {
		var w = req.query.w;
		if(!w) {
			res.locals.result = {};
			return res.render('lowbits');
		}
		var wuid_arr = w.split(",");
		var wuid_json = {};
		for(i in wuid_arr){
			wuid_json[wuid_arr[i]] = new Date(parseInt(mongo.Long.fromNumber(wuid_arr[i]).getLowBits() + "000"));
		}
		res.locals.result = wuid_json;
		res.render('lowbits');
	});

	app.get('/mobage/', function(req, res) {
				var db_host, db_port;
                var w = req.query.w;
                if(w==1){
                        db_host = settings.server.simplified_backup.host;
                        db_port = settings.server.simplified_backup.port;
                }else{
                        db_host = settings.server.traditional.host;
                        db_port = settings.server.traditional.port;
                }
                var d = req.query.d;
                var wuid = parseInt(req.query.wuid);

                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + 'login_db', function(err, getdb){
                        if (err)
                                res.end(err);
                        db = getdb;
 			db.collection('common_user',function(err,c){
				c.find({'u._id':wuid},{'mid':1}).toArray(function(err,docs){
					res.locals.result=docs;
					res.render('mobage');
				});
			});	
		});
	});

        //TODO
        app.get('/bet/', function(req, res){
                var world = req.query.world;
                if(world==1){
                        var db_host = settings.server.simplified_backup.host;
                        var db_port = settings.server.simplified_backup.port;
                }else{
                        var db_host = settings.server.traditional.host;
                        var db_port = settings.server.traditional.port;
                }
                        var t = new Date(new Date().getTime() - 86400000 *1);
                        var mm = t.getMonth()+1;
                        var dd = t.getDate();
                        if(mm < 10) mm="0"+mm;
                        if(dd < 10) dd="0"+dd;
                        var db_name = 'game_db'+t.getFullYear()+mm+dd;

                var wuid = parseInt(req.query.wuid);
		if(!wuid){
			return res.render('bet');
		}
		var t1 = new Date(req.query.start_time).getTime()/1000 | 0;
		var t2 = (new Date(req.query.end_time).getTime()+86400000)/1000 | 0;
                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + db_name, function(err, getdb){
                        if (err)
                                res.end(err);
                        db = getdb;
                        db.collection('bet_history', function(err, c){
                                if(err){
                                        res.end(err);
                                }
                                c.find({'wuid':wuid,'betTime':{$gte:t1,$lte:t2}},{'wuid':1,'ticketNumber':1,'returnTicketNumber':1,'message':1,'betTime':1}).toArray(function(err,docs){
					var csv = require('express-csv');
	                                var temp = [['wuid', 'ticketNumber', 'returnTicketNumber', 'message', 'betTime']];
        	                        docs.forEach(function(elem){
                	                        temp.push(['="'+elem.wuid+'"',elem.ticketNumber,elem.returnTicketNumber,elem.message,new Date(parseInt(elem.betTime+"000"))]);
                        	        });
                                	res.set("Content-Type", "charset=UTF-8");
	                                res.set("content-disposition", "attachment; filename=betHistory_"+wuid+"_"+req.query.start_time+"_"+req.query.end_time+".csv");
        			        res.csv(temp);
                                });
                        });
                });

        });
	
        app.get('/tianti_schedule/', function(req, res){
		var action = req.query.action;
		var world = parseInt(req.query.world);
		if(!action && !world){
			res.locals.result=[];
			res.locals.git_info="";	
			return res.render('tianti_schedule');
		}
		if(action == "git"){
			var r1 = exec("cd /data/nba/nba_game_server/;git pull");
			r1.stdout.on('data', function(data){
				res.locals.git_info = data;
				res.locals.result = [];
				var r2 = exec("perl /home/huangming/search0212/restart.pl;");
				return res.render('tianti_schedule');
			});
		}
		if(world){
			var conf = "";
			if(world==1) conf = "/data/nba/nba_game_server/app/config_data_cn/server_config_CN_PROD.js";
			if(world==2) conf = "/data/nba/nba_game_server/app/config_data_tw/server_config_TW_PROD.js"; 
			
			var data = require(conf).data;

			res.locals.result = data;
			res.locals.git_info="";
			return res.render('tianti_schedule');	
			
		}
	});		

	//TODO
        app.get('/liansai_team/', function(req, res){
		var w = parseInt(req.query.w);
		var db_host, db_port, db_name;
		if(!w) {
			res.locals.result = [];
			return res.render('liansai_team');
		}
		if(w <= 25){
                        db_host = settings.server.simplified_game_slave.host;
                        db_port = settings.server.simplified_game_slave.port;
			var db_name = settings.server.simplified_game_slave.db;
		}else if(w <= 36) {
                        db_host = settings.server.simplified_game_slave2.host;
                        db_port = settings.server.simplified_game_slave2.port;
                        db_name = settings.server.simplified_game_slave2.db;
		}else if(w <= 48){		
                        db_host = settings.server.simplified_game_slave3.host;
                        db_port = settings.server.simplified_game_slave3.port;
                        db_name = settings.server.simplified_game_slave3.db;			
		}else{
                        db_host = settings.server.simplified_game_slave4.host;
                        db_port = settings.server.simplified_game_slave4.port;
                        db_name = settings.server.simplified_game_slave4.db;

		}
                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + db_name, function(err, getdb){
                        if (err)
                                res.end(err);
                        db = getdb;
                        db.collection('nba_pvp_liansai_team', function(err, c){
                                if(err){
                                        res.end(err);
                                }
                                c.find({w:w}).toArray(function(err,docs){
                                        res.locals.result=docs.length;
                                        res.render('liansai_team');
                                });
                        });
                });

        });

		
	app.get('/liansai/', function(req, res){
                var world = req.query.world;
				var db_host, db_port;
                if(world==1){
                        db_host = settings.server.simplified_backup.host;
                        db_port = settings.server.simplified_backup.port;
			var m = "联赛发奖";
                }else{
                        db_host = settings.server.traditional.host;
                        db_port = settings.server.traditional.port;
			var m = "聯賽發獎";
                }
                        var t = new Date(new Date().getTime() - 86400000 *1);
                        var mm = t.getMonth()+1;
                        var dd = t.getDate();
                        if(mm < 10) mm="0"+mm;
                        if(dd < 10) dd="0"+dd;
                        var db_name = 'game_db'+t.getFullYear()+mm+dd;

		var wuid = parseInt(req.query.wuid);
                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + db_name, function(err, getdb){
		                
                        if (err)
                                res.end(err);
                        db = getdb;
			db.collection('game_message_center', function(err, c){
	                        if(err){
        	                        res.end(err);
                	        }
				c.find({'m':m,'u':wuid}).toArray(function(err,docs){
					res.locals.result=docs;
					res.render('liansai');
				});	
			});
		});

	});

	app.get('/backup/', function(req, res){
		var w = req.query.w;
		var db_host, db_port;
		if(w==1){
			db_host = settings.server.simplified_backup.host;
			db_port = settings.server.simplified_backup.port;
		}else{
			db_host = settings.server.traditional.host;
			db_port = settings.server.traditional.port;
		}
		var d = req.query.d;		
		var wuid = parseInt(req.query.wuid);

		if(!d || !wuid){
			 res.locals.result = [];
			 return res.render('backup');
		}
		d=d.replace(/-/g,'');	
		if(!wuid) return res.render('backup');
				console.log("*********:\t", db_host, db_port);
                MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + ('game_db'+d), function(err, getdb){
                        if (err)
                                res.end(err);
                        db = getdb;
			db.collection('game_user', function(err,c){
				if(err) return res.end(err);
				c.find({'_id':wuid}).toArray(function(err,docs){
					db.collection('nba_pvp_liansai_team', function(err,c1){
						c1.find({'_id':wuid}).toArray(function(err,docs1){
							res.locals.liansai=docs1;
 	        	                                res.locals.result=docs;
							if(!docs1 || !(docs1.length >0)){
								res.locals.other=[];
								return res.render('backup');
							}
							var g=docs1[0].g;
							var w=docs1[0].w;
			                                c1.find({'g':g,'w':w}).sort({p:-1,}).toArray(function(e,d){
                        		                        res.locals.other=d;
			                                	return res.render('backup');
							});
						});
					});
				});
			});
		});
	});
	
	app.get('/tianti/', function(req, res){
                var world = req.query.world;
				var db_host, db_port;
                if(world==1){
                        db_host = settings.server.simplified_backup.host;
                        db_port = settings.server.simplified_backup.port;
                }else{
                        db_host = settings.server.traditional.host;
                       	db_port = settings.server.traditional.port;
                }
                        var t = new Date(new Date().getTime() - 86400000 *1);
                        var mm = t.getMonth()+1;
                        var dd = t.getDate();
                        if(mm < 10) mm="0"+mm;
                        if(dd < 10) dd="0"+dd;
                        var db_name = 'game_db'+t.getFullYear()+mm+dd;

                var d = req.query.d;
			
//		var db = parseInt(req.query.area) == 1 ? db_cn : db_tw;
		var w = parseInt(req.query.w);
		var s = parseInt(req.query.s);
			console.log("tianti:\t", db_host, db_port, db_name)
     		MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + db_name.toString(), function(err, getdb){
	                if (err)
                	        res.end(err);
                	db = getdb;
	        
			
		db.collection('track_tianti_rank', function(err, c){
			if(err){
				res.end(err);
			}
			var sc = w*10000+s;
			c.find({'s':sc}).sort({'p':1}).toArray(function(err,docs){
				if(err) return res.end(err);
				res.locals.result = docs;
				res.render('tianti');
			});
		});
		});

        });

//	var project_path = "/data/nba/nba_game_server";
	var script_path = "bin/daemon/";

	app.get('/basic_service/', function(req,res) {
		var js = req.query.js;
		var js_arr = js.split(",");
		var _ENV = req.query.w;
		var _WORLD;
		if(_ENV == 1){
			_ENV=1;
			_WORLD=2;
			project_path = "/data/nba/nba_game_server";
		}else{
			_ENV=11;
			_WORLD=1;
			project_path = "/home/nba/nba_game_server";
		}
		
//		if(BS.server_config_hash) console.log("here");
//		require.cache[project_path+'/app/services/Basic_Service'] = undefined;
		var BS = require(project_path+"/app/services/Basic_Service");
		var _SERVICE_PORT=8601;

//		if(BS.server_config_hash){
		 var r1 = exec("cd "+project_path+";git pull");
            r1.stdout.on('data', function(data){	            

				 if(BS.server_config_hash){   

										var resp="";
										for(i in js_arr){
												resp += 'var '+js_arr[i]+' = '+eval('JSON.stringify(BS.'+js_arr[i]+')')+';';
										}
										res.end(resp);
				}else{
					BS.initService(false, false,false,_SERVICE_PORT, _WORLD, _ENV, 'DEBUG', function(){
						var resp="";
						for(i in js_arr){
							resp += 'var '+js_arr[i]+' = '+eval('JSON.stringify(BS.'+js_arr[i]+')')+';';
						}
						res.end(resp);
					});
				}
		});
//		}
	});
	
    app.get('/fix_achievement/', function(req,res) {
		var w=parseInt(req.query.w);
		var wuid=req.query.wuid;
		var ca=parseInt(req.query.c);
		var n=parseInt(req.query.n);
		var db_host, db_port, db_name;

		res.locals.result=0;
		if(!w || !wuid || !ca || !n){
			return res.render('fix_achievement');
		}
		if(n<0){
			return res.render('fix_achievement');
		}	
		wuid=mongo.Long.fromString(req.query.wuid);
        if(w <= 25){
                        db_host = settings.server.simplified_game_master.host;
                        db_port = settings.server.simplified_game_master.port;
			            db_name = settings.server.simplified_game_master.db;
        }else if(w <= 36) {
                        db_host = settings.server.simplified_game_master2.host;
                        db_port = settings.server.simplified_game_master2.port;
                        db_name = settings.server.simplified_game_master2.db;
        }else if(w <= 48){
                        db_host = settings.server.simplified_game_master3.host;
                        db_port = settings.server.simplified_game_master3.port;
                        db_name = settings.server.simplified_game_master3.db;
        }else{
						db_host = settings.server.simplified_game_master4.host;
                        db_port = settings.server.simplified_game_master4.port;
                        db_name = settings.server.simplified_game_master4.db;
		}

		var achievement_js= require(project_path+"/app/config_data_cn/achievement_list.js").data;
		var achievement_js_hash = {};
		var achievement_js_reverse_hash = {};
		for(x in achievement_js){
			achievement_js_hash[achievement_js[x].id]=achievement_js[x].c;
			if(!achievement_js_reverse_hash[achievement_js[x].c]){
				achievement_js_reverse_hash[achievement_js[x].c]=[];
			}
			achievement_js_reverse_hash[achievement_js[x].c].push(achievement_js[x].id);
			
		}
		MongoClient.connect("mongodb://" + db_host.toString() + ':' + db_port.toString() + '/' + db_name, function(err, getdb){
				if (err)
						return res.end(err);
				db = getdb;

				db.collection('game_achievement', function(err, c){
					if(err || !c){
						return res.end(err);
					}
					c.findOne({_id:wuid},function(err,doc){
						if(!err && doc){
							var found=false;
							for(x in doc.ach.i){
//								console.log(doc.ach[x].i);
//								console.log(achievement_js_hash[doc.ach[x].i]);
								if(achievement_js_hash[doc.ach.i[x].i] == ca){
									//console.log(JSON.stringify(doc.ach.i[x]));
									doc.ach.i[x].a=n;
									found=true;
								}
							}
							if(!found){
								for(j in achievement_js_reverse_hash[ca]){
									doc.ach.i.push({i:achievement_js_reverse_hash[ca][j],a:n});	
								}
							}
							c.update({_id:wuid},{$set:{ach:doc.ach}},function(e,r){
								if(e && !r){
									db.close;
									return res.end(e);
								}else{
									console.log("fix ach:"+wuid+":"+ca+":"+found+":"+new Date());
									res.locals.result=r;
									db.close();
									return res.render('fix_achievement');
								}
							});
						}else{
							db.close();
							return res.end(err);
						}
					});
				});
		});
	});

	app.get('/', function(req, res){
		return res.redirect('/search');
	});

	app.get('/search', function(req, res){
		res.render('search', {});
	});

	app.post('/test', function(req, res){
		res.setHeader('Content-Type', 'text/JSON;charset=UTF-8');
		var tempdb, area;
		if ((area = parseInt(req.body.area)) == 1)
			tempdb = db_cn;
		else if (area == 2)
			tempdb = db_tw;
		else
			return res.end(JSON.stringify({flag: 0, err: 0, msg: '没选择area'}));

		tempdb.collection('nba_ope_log_'+req.body.server, function(err, collection){
			if (err) {
				return console.log(err);
			}
		
			var flag,
				startTime = parseInt(req.body.start),
				endTime = parseInt(req.body.end) + 86400;
			var category = parseInt(req.body.category);

			var query;

			if (category == 1) {
				query = {
					f2: parseInt(req.body.wuid),
					f1: {'$gte': startTime, '$lte': endTime},
					'$or' : [{
						f0: 121,
						"30004": {'$gte': 0}
					}, {
						f0: 145
					}, {
						f0: 136,
						"30004": {'$gte': 0}
					}, {
                                                f0: 136,
                                                f4: "30004"
                                        },]
				};
			}
			else if (category == 2) {
				query = {
					f2: parseInt(req.body.wuid),
					f1: {'$gte': startTime, '$lte': endTime},
					'$or' : [{
						f0: 122
					},{
						f0: 135
					}]
				};
			}
			else if(category == 3) {
                                query = {
                                        f2: parseInt(req.body.wuid),
                                        f1: {'$gte': startTime, '$lte': endTime},
                                        '$or' : [{
                                                f0: 121,
						"30014": {'$gte':0}
                                        },{
                                                f0: 136,
						"30014": {'$gte':0}
                                        },{
                                                f0: 145
                                        },{
						f0: 136,
						f4: "30014"
					}]
                                };		
			}
			else if(category == 4) {
				query = {
                                        f2: parseInt(req.body.wuid),
                                        f1: {'$gte': startTime, '$lte': endTime},
                                        '$or' : [{
                                                f0: 121
                                        },{
                                                f0: 136
					},{
						f0: 145
					}]
				};
			}
                        else if(category == 5) {
                                query = {
                                        f2: parseInt(req.body.wuid),
                                        f1: {'$gte': startTime, '$lte': endTime},
                                        f0: 150
                                };
                        }
                        else if(category == 6) {
                                query = {
                                        f2: parseInt(req.body.wuid),
                                        f1: {'$gte': startTime, '$lte': endTime},
                                        f0: 151
                                };
                        }			
			collection.find(query).toArray(function (err, docs){
				//console.log(docs);
				if(err) {
					return console.log(err);
				}
				return res.end(JSON.stringify({
					flag: 1,
					docs: docs,
					total: docs.length
				}));
			});
		});		
	});

	app.get('/getxxcsv', function(req, res){
		//return res.end(JSON.stringify(req.query));
		var tempdb, area;
		if ((area = parseInt(req.query.area)) == 1)
			tempdb = db_cn;
		else if (area == 2)
			tempdb = db_tw;

		var startTime = parseInt(req.query.start),
			endTime = parseInt(req.query.end) + 86400;

		var query = {
			f0: 110,
			f1: {'$gte': startTime, '$lte': endTime},
			f3: req.query.category
		};

		tempdb.collection('nba_ope_log_'+req.query.server, function(err, collection){
			collection.find(query, {
				_id: 0,
				f5: 0,
				f6: 0,
				t: 0
			}).toArray(function(err, docs) {
				//res.end(docs.length.toString());
				var csv = require('express-csv');
				var temp = [['time', 'wuid', 'type', 'diamond', 'server']];
				docs.forEach(function(elem){
					temp.push([formatDate(elem.f1), '="' + elem.f2 + '"', elem.f3, elem.f4, elem.s]);
				});
				res.set("Content-Type", "charset=UTF-8");
				res.set("content-disposition", "attachment; filename=xuanxiuList.csv");
            	res.csv(temp);
			});
		});
	});

	app.get('/ope_statistical', function(req, res){
		res.render('ope_statistical', {title: '统计数据', results:[], info:{server: 1, wuid: 1, startServer: 0, endServer:1, typeValue: false}});
	})

	app.post('/ope_statistical', function(req, res){
		var info = new opeStatisticalDB({
			platform: parseInt(req.body.platform)||0,
			opeType: parseInt(req.body.opeType)|0,
			startServer: parseInt(req.body.startServer),
			endServer: parseInt(req.body.endServer),
			startTime: req.body.startTime,
			endTime: req.body.endTime,
			typeValue: parseInt(req.body.typeValue)||0,
		})

		if (req.body.submit === '查询数据') {
			//console.log("index:\t", "here", req.body);
			if (parseInt(req.body.opeType) < 40){
				opeStatisticalDB.queryUsersData(info, function(error, results){
					//console.log(req.body, results);
					res.render('ope_statistical', {title: '统计数据', results: results, info: req.body});
				})
			} 
			else if (parseInt(req.body.opeType) === 40){
				opeStatisticalDB.queryUsersLoginData(info, function(error, results){
					res.render('ope_statistical', {title: '统计数据', results: results, info: req.body});
				})
			}
			else if (parseInt(req.body.opeType) === 41) {
				opeStatisticalDB.queryUsersRechargeData(info, function(error, results){
					res.render('ope_statistical', {title: '统计数据', results: results, info: req.body});
				})
			} 
			else if (parseInt(req.body.opeType) === 42){
				opeStatisticalDB.queryUsersLoginDataDetail(info, function(error, results){
					res.render('ope_statistical', {title: '统计数据', results: results, info: req.body});
				})
			}

		}
		else if (req.body.submit === '导出数据') {
			if (parseInt(req.body.opeType) < 40){
				opeStatisticalDB.exportUsersData(info, function(error, results){
					//console.log("results: ", results);
					if (results){
						if (parseInt(req.body.opeType) === 1) {
							var download = [['server', 'time', 'wuid', 'type', 'diamond']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time,'="'+elem.wuid+'"', elem.type, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=xuanxiu.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 2) {
							var download = [['server', 'time', 'wuid', 'amount']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, '="'+elem.wuid+'"', elem.amount]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=tianti.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 3) {
							var download = [['server', 'time', 'wuid', 'amount']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, '="'+elem.wuid+'"', elem.amount]);
							})	
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=huangjinbei.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 4) {
							//var download = [['server', 'time', 'wuid', 'amount']];
							//var download = [['server', 'wuid', 'amount']];
							var download = [];
							results.forEach(function(elem){
								//download.push([elem.server, elem.time, '="'+elem.wuid+'"', elem.amount]);
								download.push([elem.server, '="'+elem.wuid+'"', elem.amount]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=zhouka/yueka.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 5) {
							var download = [['server', 'time', 'type', 'amount']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, elem.type, elem.amount]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=dayshopping.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 6) {
							var download = [['server', 'time', 'wuid', 'type', 'amount', 'diamond']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, '="'+elem.wuid+'"', elem.type, elem.amount, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=shangchenglibao.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 7){
							var download = [['server', 'starLevel', 'amount', 'name', 'gems']];
							results.forEach(function(elem){
								download.push([elem.server, elem.starLevel, elem.amount, elem.name, elem.gems]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=fenqu_kapai_shengxing.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 8){
							var download = [['starLevel', 'amount', 'name', 'gems']];
							results.forEach(function(elem){
								download.push([elem.server, elem.starLevel, elem.amount, elem.name, elem.gems]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=quanqu_kapai_shengxing.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 9){
							var download = [['server', 'time', 'type', 'amount', 'diamond']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, elem.type, elem.amount, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=shangcheng_libao_tongji.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 10){
							var download = [['区服', '日期', '类型', '钻石金额']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.type, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=钻石获得.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 11) {
							var download = [['server', 'time', 'Wuid', 'amount', 'win']];
							results.forEach(function(elem){
								download.push([elem.server, elem.time, '="'+elem.wuid+'"', elem.amount, elem.win]);
							})	
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=黄金杯胜负.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 12) {
							var download = [['区服', '日期', 'Wuid', '球票总数']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=球票获得.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 13) {
							var download = [['区服', '日期', 'Wuid', '球票总数']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=球票获得.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 14) {
							var download = [['区服', '日期', 'Wuid', '球票总数']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=球票获得.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 15) {
							var download = [['Server', 'Date', 'Wuid', 'Type', 'Gold']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.type, elem.gold]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=球票获得.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 16) {
							var download = [['Server', 'Date', 'Wuid', 'Type', 'Diamond']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.type, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=钻石消耗详情.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 17) {
							var download = [['Server', 'Date', 'Wuid', 'Type','Diamond']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.type, elem.diamond]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=根据钻石查询选秀数据.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 18) {
							var download = [['Server', 'Date', 'Wuid', 'CardID','Level']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.cardId, elem.level]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=觉醒数据查询.csv");
							res.csv(download);
						}
						else if (parseInt(req.body.opeType) === 19) {
							var download = [['Server', 'Date', 'Wuid', 'CardID','Level', 'Status']];
							results.forEach(function(elem){
								download.push([elem.server, elem.date, elem.wuid, elem.cardId, elem.startLevel, elem.status]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename=卡牌升星按等级查询.csv");
							res.csv(download);
						}
					}
				})
			}else if (parseInt(req.body.opeType) === 40){
				opeStatisticalDB.exportUsersLoginData(info, function(error, results){
					if (results){
						if (parseInt(req.body.opeType) === 40) {
							var download = [['server', 'number', 'date']];
							results.forEach(function(elem){
								download.push([elem.server, elem.number, elem.date]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename="+info.startServer+"-"+info.endServer+"_"+"login_data.csv");
							res.csv(download);
						}
					}
				})
			}
			else if (parseInt(req.body.opeType) === 41){
				opeStatisticalDB.exportUsersRechargeData(info, function(error, results){
					if (results.length > 0){
						if (parseInt(req.body.opeType) === 41) {
							var download = [['server', 'wuid', 'recharge', 'diamond', 'date']];
							results.forEach(function(elem){
								download.push([elem.server, '="'+elem.wuid+'"', elem.recharge, elem.diamond, elem.date]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename="+info.startServer+"-"+info.endServer+"_"+"recharge_data.csv");
							res.csv(download);
						}
					}
				})
			}else if (parseInt(req.body.opeType) === 42){
				opeStatisticalDB.exportUsersLoginDataDetail(info, function(error, results){
					if (results){
						if (parseInt(req.body.opeType) === 42) {
							var download = [['server', 'wuid', 'times', 'date']];
							results.forEach(function(elem){
								download.push([elem.server, elem.wuid, elem.times, elem.date]);
							})
							res.set("Content-Type", "charset=UTF-8");
							res.set("content-disposition", "attachment; filename="+info.startServer+"-"+info.endServer+"_"+"login_data_detail.csv");
							res.csv(download);
						}
					}
				})
			}
		}
	})

	app.get('/ope_query', function(req, res){
		res.render('ope_query', {title: '日志查询', results:[], info:{server: 1, wuid: 1, server: 0, itemType: false}});
	})
	app.post('/ope_query', function(req, res){
		var info = new opeQueryDB({
			platform: parseInt(req.body.platform),
			opeType: parseInt(req.body.opeType),
			wuid: parseInt(req.body.wuid),
			server: parseInt(req.body.server),
			itemType: req.body.itemType||0,
			startTime: req.body.startTime,
			endTime: req.body.endTime,
		})

		opeQueryDB.queryUserData(info, function(error, results){
			res.render('ope_query', {title: '日志查询', results:results, info: req.body});
		})		
	})

	app.get('/invokingjs', function(req, res){
            res.render('invokingjs', {title: '备库卡牌数据', results:[], info:{platform:1, server: 1, condition: false}});
    })
    app.post('/invokingjs', function(req, res){
            var info = new execJS({
                    platform: parseInt(req.body.platform)||1,
                    server: parseInt(req.body.server)||1,
                    dateTime: req.body.dateTime,
                    condition: req.body.condition|0,
                    type: 1
            })

		execJS.exec(info);
		res.render('invokingjs', {title: '备库卡牌数据', results:"等待30分钟左右发送到邮件, 请注意查收", info: req.body});
		
    })

    app.get('/show_log', function(req, res){
    	res.render('show_log', {title: '日志文件校验', results: [], info:{platform: 1, server: 0}});
    })

    app.post('/show_log', function(req, res){
    	var info = new showLogFile({
    		platform: parseInt(req.body.platform)||1,
    		server: parseInt(req.body.server)||0,
    		dateTime: req.body.dateTime
    	})

    	showLogFile.show(info, function(error, values){
		res.render('show_log', {title: '日志文件校验', results: values, info:req.body});
    	})
    })

        app.get('/ope_daily', function(req, res){
    	res.render('ope_daily', {title: '每日报表', info: {}, results:[]});
    })

    app.post('/ope_daily', function(req, res){
    	var daily = new dailyStatistics({
    		platform: parseInt(req.body.platform)||1,
    		opeType: parseInt(req.body.opeType)||1,
    		dateTime: req.body.dateTime
    	})

    	daily.query(function(error, values){
    		//console.log(values);
	    	if (req.body.submit === '查询数据') {
				if (!!error){
	    			res.render('ope_daily', {title: '每日统计结果查询', results: [], info: req.body});
	    		}
	    		else {
	    			//console.log(values);
	    			res.render('ope_daily', {title: '每日统计结果查询', results: values, info: req.body});
	    		}
			}
			else if (req.body.submit === '导出数据') {
				if (values){
					if (parseInt(req.body.opeType) === 1) {
						var download = [['日期', '等级', '数量']];
						values.forEach(function(elem){
							download.push([elem.date, elem.amount, elem.amount]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=每日VIP等级.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 2) {
						var download = [['区服', '日期', '类型', '钻石金额']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, elem.type, elem.diamond]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=每日商城礼包.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 3) {
						var download = [['区服', '日期', '类型', '钻石金额']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, elem.type, elem.diamond]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=选秀礼包.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 4) {
						var download = [['区服', '日期', '类型', '钻石金额']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, elem.type, elem.diamond]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=钻石消耗.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 5) {
						var download = [['区服', '日期', '数量']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, elem.type, elem.diamond]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=每日DAU.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 6) {
						var download = [['server', 'date', 'wuid', 'timers']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, "="+elem.wuid+"", elem.times]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=每日登录数据.csv");
						res.csv(download);
					}		
					else if (parseInt(req.body.opeType) === 7) {
						var download = [['server', 'wuid', 'type', 'lose', 'win', 'point', 'diamond']];
						values.forEach(function(elem){
							download.push([elem.server, "="+elem.wuid+"", elem.type, elem.lose, elem.win, elem.point, elem.diamond]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=东西部对抗赛.csv");
						res.csv(download);
					}
					else if (parseInt(req.body.opeType) === 8) {
						var download = [['server', 'date', 'diamond', 'qiupiao']];
						values.forEach(function(elem){
							download.push([elem.server, elem.date, elem.diamond, elem.qiupiao]);
						})
						res.set("Content-Type", "charset=UTF-8");
						res.set("content-disposition", "attachment; filename=活跃用户剩余钻石和球票.csv");
						res.csv(download);
					}			
				}
			}
		})
    })
	
	app.get('/query_data', function(req, res){
    	res.render('query_data', {title: 'VIP查询', info: {Email: "xxx@dena.com"}, results:""});
    })

    app.post('/query_data', function(req, res){
    	console.log(req.body);
    	var info = new execJS({
            platform: parseInt(req.body.platform)||1,
        	email: req.body.Email||0,
        	idData: req.body.idData,
        	queryType: parseInt(req.body.queryType)||0
        })

		execJS.exec(info);
		res.render('query_data', {title: '备库卡牌数据', results:"等待30分钟左右发送到邮件, 请注意查收", info: req.body});
    })

    app.get('/query_giftpack_buy', function(req, res){
    	res.render('query_giftpack_buy', {title: 'VIP礼包查询', info: {platform:1, wuid: null}, results:[]});
    })

    app.post('/query_giftpack_buy', function(req, res){
    	var condition = new gameGiftpackBuy({
                    platform: parseInt(req.body.platform)||1,
                  	wuid: parseInt(req.body.wuid)||0
            })

    	gameGiftpackBuy.query(condition, function(error, data){
    		res.locals.results = data;
    		//console.log(data);
    		res.render('query_giftpack_buy', {title: 'VIP礼包查询', info: {platform: req.body.platform, wuid: req.body.wuid}});
    	})

		//gameGiftpackBuy.exec(info);
		//res.render('query_giftpack_buy', {title: '备库卡牌数据', results:"等待30分钟左右发送到邮件, 请注意查收", info: req.body});
    })

    app.get('/union_pvp', function(req, res){
    	res.render('union_pvp', {title: '工会查询', results: []});
    })

    app.post('/union_pvp', function(req, res){
    	res.render('union_pvp', {title: '工会查询', results: []});
    })
	

};











