var http = require('http');
var fs = require('fs');
var hyperstream = require('hyperstream');
var ecstatic = require('ecstatic')(__dirname + '/static');

var persona = require('../')('http://localhost:5000');

var sessions = {};
persona.on('create', function (sid, id) {
    sessions[sid] = id.email;
});

persona.on('destroy', function (sid) {
    delete sessions[sid];
});

var server = http.createServer(function (req, res) {
    if (persona.test(req)) {
        persona.handle(req, res);
    }
    else if (req.url === '/') {
        var sid = persona.getId(req);
        fs.createReadStream(__dirname + '/static/index.html')
            .pipe(hyperstream({ '#whoami': sessions[sid] || '' }))
            .pipe(res)
        ;
    }
    else ecstatic(req, res)
});
server.listen(5000);
