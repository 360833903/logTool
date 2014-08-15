/*
*function: 查询 玩家拥有 球员等级>=18级的球员卡数量			
*		玩家拥有 超过5星球员卡的数量（5星，6星，7星卡）	
*author: 
*/

var fs = require('fs');
var async = require('async');
var mongo = require('mongodb');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var Collection = require('mongodb').Collection;
var assert = require('assert');
var child_process = require('child_process');
//var cardInfo = require('./card_list').data;

var levelValue = 18;
var starValue = 5;
var juexingValue = 1.2;
var filename;
var email_command;
var CHUNK_SIZE = 5000;
var SERVER_NO;
var host_address = "localhost";
var argv = process.argv.slice(2);
var email_title = " -u \"***Daily Report***\" -a ";
var email_postfix = " -xu nagios@em.denachina.com -xp 123qweasdzxc -s smtp.em.denachina.com";
var email_script = "/usr/bin/printf \"%b\" \"***** card information query *****\" | /usr/local/bin/sendEmail.pl -f nagios@em.denachina.com -t ";

main();

function main(){
	console.log("main:", argv);
	if (argv.length != 4) {
		console.log("Usage: node xxx.js platform(simplified, tranditional) serverNo dbName Condition");
	}
	else if (argv[0].toString() === "simplified") {
		host_address = "10.96.36.40";
		filename = fs.realpathSync('.')+"/models/"+argv[0].toString()+"_user_card_info_"+argv[1].toString()+".csv";
		email_command = email_script+"fan.yang@dena.com jianwei.zhao@dena.com chengjie.hu@dena.com shan.beileng@dena.com"+email_title+filename+email_postfix;
		//email_command = email_script+"jianwei.zhao@dena.com"+email_title+filename+email_postfix;
		
		queryUserCardInfo(parseInt(argv[1]), argv[2].toString(), host_address, argv[3].split("/"));
	}
	else if (argv[0].toString() === "tranditional") {
		host_address = "54.238.138.78";
		filename = fs.realpathSync('.')+"/models/"+argv[0].toString()+"_user_card_info_"+argv[1].toString()+".csv";
		email_command = email_script+"zhenghuan.xu@dena.com mingkuan.chen@dena.com yu.lin@dena.com shen.yu@dena.jp shan.beileng@dena.com"+email_title+filename+email_postfix;
		
		queryUserCardInfo(parseInt(argv[1]), argv[2].toString(), host_address, argv[3].split("/"));
	}
	else {
		console.log("arguments error...");
	}
}

function queryUserCardInfo(server, dbs, address, condition){
	if (condition.length === 3){
		levelValue = parseInt(condition[0]);
		starValue = parseInt(condition[1]);
		juexingValue = Number(condition[2]);
	}

	console.log(server, dbs, address, condition, levelValue, starValue, juexingValue);
	var stream = fs.WriteStream(filename.toString());
	var game_db = new Db(dbs.toString(), new Server(address.toString(), 27017, {auto_reconnect: true}), {safe:true});
	var game_coll = new Collection(game_db, "game_user");
	
	game_coll.count({w: server}, function(error, total){
		console.log("total: ", total);
		var start = 0;	
		async.whilst(
			function(){ return start < total; },
			function(callback){
				game_coll.find({w: server}, {_id: 1, card: 1, w: 1}).limit(CHUNK_SIZE).skip(start).toArray(function(error, results){
					console.log(results.length);
					for (var i = 0; i < results.length; i++) {
						if (results[i].card) {
							//统计完美觉醒
							for (var j = 0; j < results[i].card.length; j++) {
								if (results[i].card[j].am >= juexingValue) {
									var data = "juexing,"+results[i].w+",=\""+results[i]._id+"\","+results[i].card[j].am+"\n";
									stream.write(data);
								}
							};
							//统计>=18级球卡
							var lv_number = 0;
							for (var j = 0; j < results[i].card.length; j++) {
								if (parseInt(results[i].card[j].lv) >= levelValue) {
									++lv_number;
								}
							}
							if (lv_number > 0) {
								var data = "level,"+results[i].w+",=\""+results[i]._id+"\","+lv_number+"\n";	
								stream.write(data);
							}

							//统计>=5星
							var star_number = 0;
							for (var j = 0; j < results[i].card.length; j++) {
								if (parseInt(results[i].card[j].s) >= starValue) {
									++star_number;
								}
							}
							if (star_number > 0) {
								var data = "star,"+results[i].w+",=\""+results[i]._id+"\","+star_number+"\n";
								stream.write(data);	
							}
						}						
					}
					start += CHUNK_SIZE;
					callback(null, 'ok');
				})
			},
			function(error, result){
				child = child_process.exec(email_command, function(error, stdout, stderr){
					console.log(stdout);
					console.log(stderr);
					process.exit(1);
				});
			}
		)
	})
}


/*function getCardQuality(card_id){
	for (var i = 0; i < cardInfo.length; i++) {
		if (cardInfo[i]._id === card_id){
			return cardInfo[i].q;
		}
	};
	return "";
}*/
