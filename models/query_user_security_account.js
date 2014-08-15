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
var email_title = " -u \"*** 帐号安全查询 ***\" -a ";
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
		var filename = __dirname+"/"+getRandomValue()+"_query_user_security_account.csv";
		var email_command = email_script+argv[2].toString()+email_title+filename+email_postfix;

		queryUserWuidAsMid(filename, midData, host_ip, email_command, argv[1].toString());
	}
	else if (argv[0].toString() === "tranditional") {
		var host_ip = "54.238.138.78";
		var midData = require('./'+argv[1].toString()).data;
		var filename = __dirname+"/"+getRandomValue()+"_query_user_security_account.csv";
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

	var game_db = new Db(getGameDB(), new Server(address.toString(), 27017, {auto_reconnect: true}), {safe: true});
	var game_coll = new Collection(game_db, "game_user");

	var start = 0;
	async.whilst(
		function(){ return start < midData.length; },
		function(callback){
			common_coll.find({mid: midData[start][0]}, {u: 1}).toArray(function(error, values){
				if (values != undefined && values.length === 1){
					var sstart = 0;
					async.whilst(
						function(){ return sstart < values[0].u.length; },
						function(scallback){
							game_coll.find({_id: values[0].u[sstart]._id}, {ii:1, vip:1}).toArray(function(error, results){
									if (results.length != 0){
									var level = 0;
									for (var j = 0; j < results[0].ii.length; j++) {
										if (results[0].ii[j].i === 30002){
											level = getUserLevel(results[0].ii[j].a);
											break;
										}
									}
									var data = midData[start][0]+","+values[0].u[sstart].w+",=\""+values[0].u[sstart]._id+"\",\""+values[0].u[sstart].n+"\","+level+","+results[j].vip[0]+"\n";
									console.log(start, data);
									stream.write(data);
								} else {
									var data = midData[start][0]+","+values[0].u[sstart].w+",=\""+values[0].u[sstart]._id+"\",\""+values[0].u[sstart].n+"\",0,0\n";
									console.log(start, data);
									stream.write(data);
								}
								++sstart;
								scallback(null, 'ok');
							})
						},
						function(error, result){
							++start;
							callback(null, 'ok');
						}
					)
				}
				else {
					++start;
					callback(null, 'ok');
				}
			})
		},
		function(error, result){
			console.log(error, result);
			var child = child_process.exec(email, function(error, stdout, stderr){
				console.log(stdout);
				console.log(stderr);
				spawn('rm', ['-rf', filename.toString(), filename2.toString()]);
				process.exit(0);
			});
		}
	)
}

function getRandomValue(){
	return parseInt(Math.random()*1000).toString();
}

function getGameDB(){
	var date = new Date((new Date().getTime())-86400000);
	return "game_db"+(date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate()).toString();
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
