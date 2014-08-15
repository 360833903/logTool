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
var spawn = require('child_process').spawn;

var userExp = require('./system_team_exp').data;

var host_address = "localhost";
var argv = process.argv.slice(2);
var email_title = " -u \"*** 根据游戏ID查询VIP等级和等级***\" -a ";
var email_postfix = " -xu nagios@em.denachina.com -xp 123qweasdzxc -s smtp.em.denachina.com";
var email_script = "/usr/bin/printf \"%b\" \"***** query user vip as wuid *****\" | /usr/local/bin/sendEmail.pl -f nagios@em.denachina.com -t ";
main();

function main(){
	if (argv.length != 3) {
		console.log("Usage: node xxx.js platform(simplified, tranditional) Filename Email");
	}
	else if (argv[0].toString() === "simplified") {
		var host_ip = "10.96.36.40";
		var wuidData = require('./'+argv[1].toString()).data;
		var filename = __dirname+"/"+getRandomValue()+"_query_user_vip_as_wuid.csv";
		var email_command = email_script+argv[2].toString()+email_title+filename+email_postfix;

		queryUserVip(filename, wuidData, host_ip, email_command, argv[1].toString());
		
	}
	else if (argv[0].toString() === "tranditional") {
		var host_ip = "54.238.138.78";
		var wuidData = require('./'+argv[1].toString()).data;
		var filename = __dirname+"/"+getRandomValue()+"_query_user_vip_as_wuid.csv";
		var email_command = email_script+argv[2].toString()+email_title+filename+email_postfix;

		queryUserVip(filename, wuidData, host_ip, email_command, argv[1].toString());
	}
	else {
		console.log("arguments error...");
	}
}

function queryUserVip(filename, wuidData, address, email, filename2){
	var stream = fs.WriteStream(filename);
	stream.write("wuid, level, vip, name\n");

	var game_db = new Db(getGameDB(), new Server(address.toString(), 27017, {auto_reconnect: true}), {safe: true});
	var game_coll = new Collection(game_db, "game_user");

	var start = 0;
	async.whilst(
		function(){return start < wuidData.length;},
		function(callback){
			game_coll.find({_id: parseInt(wuidData[start][0])}, {ii:1, vip:1, n:1}).toArray(function(error, results){
				if (results.length != 0){
					var level = 0;
					for (var i = 0; i < results[0].ii.length; i++) {
						if (results[0].ii[i].i === 30002){
							level = getUserLevel(results[0].ii[i].a);
						}
					};
					var data = "=\""+wuidData[start][0]+"\","+level+","+results[0].vip[0]+",\""+results[0].n+"\"\n";
					//console.log(data);
					stream.write(data);
				}
				else {
					var data = "=\""+wuidData[start][0]+"\",0,0,\"null\"\n";
					//console.log(data);
					stream.write(data);
				}
				++start;
				callback(null, 'ok');
			})
			
		},
		function(error, result){
			var child = child_process.exec(email, function(error, stdout, stderr){
				console.log(stdout);
				console.log(stderr);
				//spawn('rm', ['-rf', filename.toString(), filename2.toString()]);
				process.exit(0);
			});
		}
	)
}


function getGameDB(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
}

function getRandomValue(){
	return parseInt(Math.random()*1000).toString();
}

function getUserLevel(exp){
    if(exp<1) return 1;

    var mmax=80;
    if(mmax>userExp.length) mmax=userExp.length;
    for(var i=1; i<mmax; i++){
        if(exp<userExp[i].limit[0]) return i;
    }   
    return mmax;
}
