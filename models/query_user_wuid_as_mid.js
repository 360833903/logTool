var fs = require('fs');
var async = require('async');
var mongo = require('mongodb');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var Collection = require('mongodb').Collection;
var assert = require('assert');
var child_process = require('child_process');
var spawn = require('child_process').spawn;

var host_address = "localhost";
var argv = process.argv.slice(2);
var email_title = " -u \"*** 根据梦宝谷ID查询游戏ID和区服***\" -a ";
var email_postfix = " -xu nagios@em.denachina.com -xp 123qweasdzxc -s smtp.em.denachina.com";
var email_script = "/usr/bin/printf \"%b\" \"***** query user vip as wuid *****\" | /usr/local/bin/sendEmail.pl -f nagios@em.denachina.com -t ";

main();

function main() {
	if (argv.length != 3) {
		console.log("Usage: node xxx.js platform(simplified, tranditional) Filename Email");
	}
	else if (argv[0].toString() === "simplified") {
		var host_ip = "10.96.36.40";
		var midData = require('./'+argv[1].toString()).data;
		var filename = __dirname+"/"+getRandomValue()+"_query_user_wuid_as_mid.csv";
		var email_command = email_script+argv[2].toString()+email_title+filename+email_postfix;

		queryUserWuidAsMid(filename, midData, host_ip, email_command, argv[1].toString());
	}
	else if (argv[0].toString() === "tranditional") {
		var host_ip = "54.238.138.78";
		var midData = require('./'+argv[1].toString()).data;
		var filename = __dirname+"/"+getRandomValue()+"_query_user_wuid_as_mid.csv";
		var email_command = email_script+argv[2].toString()+email_title+filename+email_postfix;

		queryUserWuidAsMid(filename, midData, host_ip, email_command, argv[1].toString());
	}
	else {
		console.log("arguments error...");
	}
}

function queryUserWuidAsMid(filename, midData, address, email, filename2){
	var stream = fs.WriteStream(filename);

	var login_db = new Db('login_db', new Server(address.toString(), 27017, {auto_reconnect: true}), {safe: true});
	var common_coll = new Collection(login_db, "common_user");

	var start = 0;
	async.whilst(
		function(){return start < midData.length;},
		function(callback){
			common_coll.find({mid: midData[start][0]}, {u: 1}).toArray(function(error, values){
				//console.log(values);
				if (values != undefined && values.length === 1){
					for (var i = 0; i < values[0].u.length; ++i) {
						//console.log(midData[start][0], values[0].u[i]);
						var data = midData[start][0]+","+values[0].u[i].w+",=\""+values[0].u[i]._id+"\",\""+values[0].u[i].n+"\"\n";
						stream.write(data);
					}
				}
				++start;
				callback(null, 'ok');
			});
		},
		function(error, result){
			console.log("************:\t", error, result);
			//if (error === null){
				var child = child_process.exec(email, function(error, stdout, stderr){
					console.log(stdout);
					console.log(stderr);
					spawn('rm', ['-rf', filename.toString(), filename2.toString()]);
					process.exit(0);
				});
			//}
		}
	)
}

function getRandomValue(){
	return parseInt(Math.random()*1000).toString();
}