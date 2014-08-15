var fs = require('fs');
var async = require('async');

var mongo = require('./mongoConfig');
var eventType = require('../public/javascripts/eventType').EventType;

module.exports = function(argv){
	return new Handler(argv);
}

var Handler = function(argv){
	this.argv = argv;
}

var handler = Handler.prototype;

handler.query = function(callback){
	var results = [];
	var simplifiedfilePath = "/data/log/report/";
	var traditionalFilePath = "/data/log/report/traditional/";
	if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 1){
		var filename = getFilename(this.argv.dateTime, "_simple_day_vip", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: JSON.parse(dataArray[i]).date, level: JSON.parse(dataArray[i]).vip, amount: JSON.parse(dataArray[i]).amount});				
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 2){
		var filename = getFilename(this.argv.dateTime, "_simple_statistics_day_itempack", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[1], server: dataArray[i].split(',')[0], type: dataArray[i].split(',')[2], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 3){
		var filename = getFilename(this.argv.dateTime, "_simple_statistics_day_xuanxiu", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[1], server: dataArray[i].split(',')[0], type: dataArray[i].split(',')[2], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 4){
		var filename = getFilename(this.argv.dateTime, "_simple_day_shopping", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[4], server: dataArray[i].split(',')[0], type: eventType[parseInt(dataArray[i].split(',')[2])], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 5){
		var filename = getFilename(this.argv.dateTime, "_simplified_day_dau", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				var total = 0;
				for (var i = 0; i < dataArray.length-1; i++) {
					total += parseInt(dataArray[i].split(',')[2]);
					results.push({date: dataArray[i].split(',')[0], server: parseInt(dataArray[i].split(',')[1]), amount: parseInt(dataArray[i].split(',')[2])});
				}
				results.sort(by("server"));
				results.push({date: "", server: "总计", amount: total});
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 6){
		var filename = getFilename(this.argv.dateTime, "_simple_day_login", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					results.push({date: lineData[0], server: lineData[1], wuid: lineData[2], times: lineData[3]});
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 7){
		var filename = getFilename(this.argv.dateTime, "_complex_east_and_west", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					results.push({server: lineData[0], wuid: lineData[1], type: lineData[2], lose: lineData[3], win: lineData[4], point: lineData[5], diamond: lineData[6]});
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 1 && parseInt(this.argv.opeType) === 8){
		var filename = getFilename(this.argv.dateTime, "_simplified_active_user_balance", simplifiedfilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var diamond = 0, qiupiao = 0, date = '';
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					if (lineData[2] != 0 || lineData[3] != 0){
						diamond += parseInt(lineData[2]);
						qiupiao += parseInt(lineData[3]);
						date = lineData[1];
						results.push({server: lineData[0], date: lineData[1], diamond: lineData[2], qiupiao: lineData[3]});
					}					
				}
				results.push({server: '总计', date: date, diamond: diamond, qiupiao: qiupiao});
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 1){
		var filename = getFilename(this.argv.dateTime, "_complex_day_vip", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: JSON.parse(dataArray[i]).date, level: JSON.parse(dataArray[i]).vip, amount: JSON.parse(dataArray[i]).amount});				
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 2){
		var filename = getFilename(this.argv.dateTime, "_complex_statistics_day_itempack", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[1], server: dataArray[i].split(',')[0], type: dataArray[i].split(',')[2], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})		
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 3){
		var filename = getFilename(this.argv.dateTime, "_complex_statistics_day_xuanxiu", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[1], server: dataArray[i].split(',')[0], type: dataArray[i].split(',')[2], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 4){
		var filename = getFilename(this.argv.dateTime, "_complex_day_shopping", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					results.push({date: dataArray[i].split(',')[4], server: dataArray[i].split(',')[0], type: eventType[parseInt(dataArray[i].split(',')[2])], diamond: dataArray[i].split(',')[3]});
				}
				results.sort(by("server"));
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 5){
		var filename = getFilename(this.argv.dateTime, "_traditional_day_dau", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				var total = 0;
				for (var i = 0; i < dataArray.length-1; i++) {
					total += parseInt(dataArray[i].split(',')[2]);
					results.push({date: dataArray[i].split(',')[0], server: parseInt(dataArray[i].split(',')[1]), amount: parseInt(dataArray[i].split(',')[2])});
				}
				results.sort(by("server"));
				results.push({date: "", server: "总计", amount: total});
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 6){
		var filename = getFilename(this.argv.dateTime, "_complex_day_login", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					results.push({date: lineData[0], server: lineData[1], wuid: lineData[2], times: lineData[3]});
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 7){
		var filename = getFilename(this.argv.dateTime, "_complex_east_and_west", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					results.push({server: lineData[0], wuid: lineData[1], type: lineData[2], lose: lineData[3], win: lineData[4], point: lineData[5], diamond: lineData[6]});
				}
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else if (parseInt(this.argv.platform) === 2 && parseInt(this.argv.opeType) === 8){
		var filename = getFilename(this.argv.dateTime, "_traditional_active_user_balance", traditionalFilePath);
		fs.readFile(filename, 'utf8', function(error, data){
			if (error === null){
				var dataArray = data.split('\n');
				var diamond = 0, qiupiao = 0, date = '';
				for (var i = 0; i < dataArray.length-1; i++) {
					var lineData = dataArray[i].split(',');
					if (lineData[2] != 0 || lineData[3] != 0){
						diamond += parseInt(lineData[2]);
						qiupiao += parseInt(lineData[3]);
						date = lineData[1];
						results.push({server: lineData[0], date: lineData[1], diamond: lineData[2], qiupiao: lineData[3]});
					}	
				}
				results.push({server: "总计", date: date, diamond: diamond, qiupiao: qiupiao});
				return callback(null, results);
			}
			else {
				return callback(null, results);
			}
		})
	}
	else {
		callback(1, results);
	}	
}

function getFilename(dateTime, filename, path){
	var date_time_ = dateTime.toString().split('-');
	if (parseInt(date_time_[2]) < 10){
		return path.toString()+date_time_[0].toString()+date_time_[1].toString()+"0"+parseInt(date_time_[2]).toString()+filename+".csv";
	}
	else {
		return path.toString()+date_time_[0].toString()+date_time_[1].toString()+date_time_[2].toString()+filename+".csv";
	}
}

function getYesterDayDate(){
    var yesterday = new Date(new Date().getTime()-86400000);
    return yesterday.getFullYear()*10000+(yesterday.getMonth()+1)*100+yesterday.getDate();
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
