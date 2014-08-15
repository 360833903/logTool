var fs = require('fs');

module.exports = showLogFile;

function showLogFile(info){
	this.platform = info.platform;
	this.dateTime = info.dateTime;
	this.server = info.server;
}

showLogFile.show = function(info, callback){
	var values = new Array();
	if (info.platform === 1){
		var filenameT = "/data/log/shell/log/simplified/"+getTodayDate(info.dateTime.toString())+"_log_file.log";
		fs.readFile(filenameT, function(error, dataT){
			if (error != null){
				return callback(error, values);
			}

			var logDataT = dataT.toString('utf8', 0, dataT.length).split("\n");

			if (info.server === 0){
				for (var i = 0; i < logDataT.length-1; i++) {
					values.push(JSON.parse(logDataT[i]));
				}
				//console.log("yesterday: ", getYesterdayDate(info.dateTime.toString()));
				var filenameY = "/data/log/shell/log/simplified/"+getYesterdayDate(info.dateTime.toString())+"_log_file.log";

				fs.readFile(filenameY, function(error, dataY){
					if (error != null){
						values.sort(by('server'));
						return callback(null, values);
					}

					var logDataY = dataY.toString('utf8', 0, dataY.length).split("\n");

					for (var j=0; j<logDataY.length-1; ++j){
						values.push(JSON.parse(logDataY[j]));
					}

					values.sort(by("server"));
					return callback(null, mergeData(values));
				})		
			}
			else {
				for (var i = 0; i < logDataT.length-1; i++) {
					if (parseInt(JSON.parse(logDataT[i]).server) === info.server){
						values.push(JSON.parse(logDataT[i]));
					}
				}
				var filenameY = "/data/log/shell/log/simplified/"+getYesterdayDate(info.dateTime.toString())+"_log_file.log";

				fs.readFile(filenameY, function(error, dataY){
					if (error != null){
						return callback(null, values);
					}

					var logDataY = dataY.toString('utf8', 0, dataY.length).split("\n");
					
					for (var j=0; j<logDataY.length-1; ++j){
						if (parseInt(JSON.parse(logDataY[j]).server) === info.server){
							values.push(JSON.parse(logDataY[j]));
						}
					}

					return callback(null, mergeData(values));
				})
			}
		})
	}
	else if (info.platform === 2){
		var filenameT = "/data/log/shell/log/traditional/"+getTodayDate(info.dateTime.toString())+"_log_file.log";
		fs.readFile(filenameT, function(error, dataT){
			if (error != null){
				return callback(error, values);
			}

			var logDataT = dataT.toString('utf8', 0, dataT.length).split("\n");

			if (info.server === 0){
				for (var i = 0; i < logDataT.length-1; i++) {
					values.push(JSON.parse(logDataT[i]));
				}
				var filenameY = "/data/log/shell/log/traditional/"+getYesterdayDate(info.dateTime.toString())+"_log_file.log";
				fs.readFile(filenameY, function(error, dataY){
					if (error != null){
						values.sort(by("server"));
						return callback(null, values);
					}

					var logDataY = dataY.toString('utf8', 0, dataY.length).split("\n");

					for (var j=0; j<logDataY.length-1; ++j){
						values.push(JSON.parse(logDataY[j]));
					}

					values.sort(by("server"));
					return callback(null, mergeData(values));
				})		
			}
			else {
				for (var i = 0; i < logDataT.length-1; i++) {
					if (parseInt(JSON.parse(logDataT[i]).server) === info.server){
						values.push(JSON.parse(logDataT[i]));
					}
				}
				var filenameY = "/data/log/shell/log/traditional/"+getYesterdayDate(info.dateTime.toString())+"_log_file.log";
                fs.readFile(filenameY, function(error, dataY){
                	if (error != null){
                		return callback(null, values);
                	}

                    var logDataY = dataY.toString('utf8', 0, dataY.length).split("\n");

                    for (var j=0; j<logDataY.length-1; ++j){
                            if (parseInt(JSON.parse(logDataY[j]).server) === info.server){
								values.push(JSON.parse(logDataY[j]));
							}
                    }

                    return callback(null, mergeData(values));
                })
			}
		})
	}
	else {
		callback(null, values);
	}
	
}

function mergeData(values){
	var results = new Array();
	for (var i=0; i<values.length; ++i){
		var index = findData(results, values[i]);
		if (index != -1){
			results[index].name = results[index].name+",\t"+values[i].name;
		}
		else {
			results.push({"server":values[i].server, "node":values[i].node, "name":values[i].name});
		}
	}
	return results;
}

function findData(values, value){
	for (var i=0; i<values.length; ++i){
		if ((values[i].server === value.server) && (values[i].node === value.node)){
			return i;
		}
	}
	return -1;
}

function getTodayDate(dateTime){
	return dateTime.split('-')[0]+dateTime.split('-')[1]+dateTime.split('-')[2];
}

function getYesterdayDate(dateTime){
	if (parseInt(dateTime.split('-')[2]) <= 10){
		return (dateTime.split('-')[0]+dateTime.split('-')[1]+"0"+(parseInt(dateTime.split('-')[2]-1)).toString()).toString();;
	}
	else {
		return (dateTime.split('-')[0]+dateTime.split('-')[1]+(parseInt(dateTime.split('-')[2]-1)).toString()).toString();;
	}
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

var reversed = function(name){
	return function(o, p){
        	var a, b;
        	if (typeof o === "object" && typeof p === "object" && o && p) {
			a = o[name];
			b = p[name];
			if (a === b) {
				return 0;
			}
			if (typeof a === typeof b) {
				return a < b ? 1 : -1;
			}
			return typeof a < typeof b ? -1 : 1;
		}
		else {
			throw ("error");
		}
	}
}

