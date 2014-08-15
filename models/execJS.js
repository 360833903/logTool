var fs = require('fs');
var process = require('child_process');
var spawn = require('child_process').spawn;

module.exports = execJS;

function execJS(info){
	this.platform = info.platform;
	this.dateTime = info.dateTime;
	this.server = info.server;
	this.condition = info.condition;
	this.queryType = info.queryType;
	this.email = info.email;
	this.idData = info.idData;
}

execJS.exec = function(info/*callback*/){

	if (info.platform === 1 && info.queryType === 1){
		var child = spawn('node', [fs.realpathSync('.')+"/models/query_user_card.js", 'simplified', info.server.toString(), getTimeTag(info.dateTime).toString(), info.condition.toString()]);
        child.stdout.on('data', function (data) {
                console.log('数据..：\n' + data);
        });
        child.on('exit', function (code, signal) {
                console.log('子进程已退出，代码：' + code);
        });
	}
	else if (info.platform === 1 && info.queryType === 2){
		var filename = writeData(info.idData);
		
		var child = spawn('node', [__dirname+"/query_user_vip_as_wuid.js", 'simplified', filename, info.email.toString()]);
        child.stdout.on('data', function (data) {
                console.log('数据..:\n' + data);
        });
        child.on('exit', function (code, signal) {
            console.log('子进程已退出，代码：' + code);
        });
	}
	else if (info.platform === 1 && info.queryType === 3){
		var filename = writeData(info.idData);
		var child = spawn('node', [__dirname+"/query_user_wuid_as_mid.js", 'simplified', filename, info.email.toString()]);
		child.stdout.on('data', function(data){
			console.log('数据..:\n'+data);
		});

		child.on('exit', function(code, signal){
			console.log('子进程已退出, 代码:'+code+":"+signal);
		})
	}
	else if (info.platform === 1 && info.queryType === 4){
		var filename = writeData(info.idData);
		var child = spawn('node', [__dirname+"/query_user_security_account.js", 'simplified', filename, info.email.toString()]);
		child.stdout.on('data', function(data){
			console.log('数据..:\n'+data);
		});

		child.on('exit', function(code, signal){
			console.log('子进程已退出, 代码:'+code+":"+signal);
		})
	}
	else if (info.platform === 2 && info.queryType === 1){
		var child = spawn('node', [fs.realpathSync('.')+"/models/query_user_card.js", 'tranditional', info.server.toString(), getTimeTag(info.dateTime).toString(), info.condition.toString()]);
		child.stdout.on('data', function (data) { 
			console.log('数据..：\n' + data); 
		});
		child.on('exit', function (code, signal) {
			console.log('子进程已退出，代码：' + code); 
		}); 
	}
	else if (info.platform === 1 && info.queryType === 2){
		var filename = writeData(info.idData);
		
		var child = spawn('node', [__dirname+"/query_user_vip_as_wuid.js", 'tranditional', filename, info.email.toString()]);
        child.stdout.on('data', function (data) {
                console.log('数据..:\n' + data);
        });
        child.on('exit', function (code, signal) {
                console.log('子进程已退出，代码：' + code);
        });
	}
	else if (info.platform === 1 && info.queryType === 3){
		var filename = writeData(info.idData);
		var child = spawn('node', [__dirname+"/query_user_wuid_as_mid.js", 'tranditional', filename, info.email.toString()]);
		child.stdout.on('data', function(data){
			console.log('数据..:\n'+data);
		});

		child.on('exit', function(code, signal){
			console.log('子进程已退出, 代码:'+code+":"+signal);
		})
	}
	else if (info.platform === 1 && info.queryType === 4){
		var filename = writeData(info.idData);
		var child = spawn('node', [__dirname+"/query_user_security_account.js", 'tranditional', filename, info.email.toString()]);
		child.stdout.on('data', function(data){
			console.log('数据..:\n'+data);
		});

		child.on('exit', function(code, signal){
			console.log('子进程已退出, 代码:'+code+":"+signal);
		})
	}
	else {
		console.log("execJS argument error");
		//callback(1);
	}
}

function getTimeTag(date){
	var splitStr = date.split('-');
	return "game_db"+splitStr[0]+splitStr[1]+splitStr[2];
}

function writeData(data){
	var filename = parseInt(Math.random()*1000).toString()+"_wuids.js";
	var stream = fs.WriteStream(__dirname+"/"+filename);
	stream.write("exports.data = [");
	var wuidData = data.split("\r\n");
	for (var i = 0; i < wuidData.length; i++) {
		if (i+1 !== wuidData.length){
			stream.write("["+wuidData[i]+"],\n");
		}
		else {
			stream.write("["+wuidData[i]+"]]");
		}
	};
	return filename;
}

