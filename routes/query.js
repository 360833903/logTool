var us = require('underscore');
var query = require('../models/queryMidAsNameAndServer');
var dau = require('../models/opeStatistical');

/*
 * Get 
 * */
exports.queryUserMid = function(req, res){
	var args = us.extend({}, req.query, req.body, req.params);
	query.query_user_mid_as_server_and_name(parseInt(args.server)||0, args.name||'', function(error, data){
		res.writeHead(200, {'Content-Type': 'application/json'});
		if (!error){
			console.log(data);
			res.end('{mid:'+data.toString()+'}');
		}
		else {
			res.end('{mid: 0}');
		}
	})
}

exports.queryServerDau = function(req, res){
	var args = us.extend({}, req.query, req.body, req.params);
	var params = new dau({
		platform: parseInt(args.platform)||0,
		opeType: parseInt(args.opeType)||0,
		startServer: parseInt(args.startServer)||0,
		endServer: parseInt(args.endServer)||0,
		startTime: args.startTime,
		endTime: args.endTime,
		typeValue: parseInt(args.typeValue)||0
	})
	
	dau.queryUsersLoginData(params, function(error, results){
		res.writeHead(200, {'Content-Type': 'application/json'});
		if (!error){
			res.end(JSON.stringify(results));
		}
		else {
			res.end();
		}
	})	
	
}
