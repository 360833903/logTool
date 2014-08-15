
var ENTRIES_PER_PAGE = 30;

function toTimeStamp(datestr) {
	var datearr = datestr.split('-', 3);
	var date = new Date(parseInt(datearr[0]), parseInt(datearr[1]) - 1, parseInt(datearr[2]));
	return date.getTime() / 1000;
};

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

$(document).ready(function() {
	for(var i=1; i <= 20; ++i)
    	$('#server').append("<option value="+i+">"+i+"区"+"</option>");
});

function check() {
	if($('#area').val()==0)
		return alert("请选择简繁体");
	var category = $("[name='category']").val(); 
	if($('#server').val()==0)
		return alert("请选择所在区");
	if(category == null || category == "")
		return alert("请选择类型");
	if($('#start').val() == null || $('#start').val()=="")
		return alert("请选择开始时间");
	if($('#end').val() == null || $('#end').val()=="")
		return alert("请选择结束时间");
	if ($('#end').val() < $('#start').val())
		return alert("结束时间应该在开始时间之后");

	$('#ing').text('正在查询中...');
	var query = {
		area: $('#area').val(),
		server: $('#server').val(),
		category: category,
		start: toTimeStamp($('#start').val()),
		end: toTimeStamp($('#end').val()),
		page: 1
	};
	
	$.post('/xuanxiu', query ,function(result) {
		$("#mytable tr").remove();
		$('#ing').text('');
		$('#mytable').append("<tr><th width='50px'>序号</th><th width='160px'>时间</th><th width='140px'>wuid</th><th width='90px'>f3</th><th width='60px'>钻石币</th><th width='40px'>s</th></tr>");
		var obj = JSON.parse(result);
		if (obj.flag == 0) {
			$('#ing').text(obj.msg);
			return;
		}
		$('#data').val(JSON.stringify(query));
		var docs = obj.docs;
		var length = docs.length;
		$('#total').val(obj.total);

		$('#prevpagebt').attr('disabled', false);
		$('#nextpagebt').attr('disabled', false);

		for (var i = 0; i < ENTRIES_PER_PAGE; i++) {
			var entry = docs[i];
			if (entry == null)
				continue;
			$('#mytable').append("<tr><td>" + (i+1) + "</td><td>" + formatDate(entry.f1) + "</td><td>" + entry.f2 + "</td><td>" + entry.f3 + "</td><td>" + entry.f4 + "</td><td>" + entry.s + "</td></tr>");
		}
		var totalpage = Math.ceil(obj.total / ENTRIES_PER_PAGE);
		document.getElementById('nowpage').innerHTML = "第1页 ";
		document.getElementById('totalpage').innerHTML = "共" + totalpage + '页';
	});
};

function check2() {
	if($('#area').val()==0)
		return alert("请选择简繁体");
	var category = $("[name='category']").val(); 
	if($('#server').val()==0)
		return alert("请选择所在区");
	if(category == null || category == "")
		return alert("请选择类型");
	if($('#start').val() == null || $('#start').val()=="")
		return alert("请选择开始时间");
	if($('#end').val() == null || $('#end').val()=="")
		return alert("请选择结束时间");
	if ($('#end').val() < $('#start').val())
		return alert("结束时间应该在开始时间之后");
	location.href = '/getxxcsv?area=' +  $('#area').val() + '&server=' + $('#server').val() + '&category=' + category + '&start=' + toTimeStamp($('#start').val()) + '&end=' + toTimeStamp($('#end').val());
};

function topage(dst) {
	$('#ing').text('正在查询中');
	$('#prevpagebt').attr('disabled', true);
	$('#nextpagebt').attr('disabled', true);
	var query = JSON.parse($('#data').val());
	query.page = dst;
	$.post('/xuanxiu', query ,function(result) {
		$("#mytable tr").remove();
		$('#ing').text('');

		$('#mytable').append("<tr><th width='50px'>序号</th><th width='160px'>时间</th><th width='140px'>wuid</th><th width='90px'>f3</th><th width='60px'>钻石币</th><th width='40px'>s</th></tr>");
		var obj = JSON.parse(result);
		if (obj.flag == 0) {
			$('#ing').text(obj.msg);
			return;
		}
		$('#data').val(JSON.stringify(query));
		var docs = obj.docs;
		var length = docs.length;
		$('#total').val(obj.total);

		$('#prevpagebt').attr('disabled', false);
		$('#nextpagebt').attr('disabled', false);

		for (var i = 0; i < ENTRIES_PER_PAGE; i++) {
			var entry = docs[i];
			if (entry == null)
				continue;
			$('#mytable').append("<tr><td>" + (i+1) + "</td><td>" + formatDate(entry.f1) + "</td><td>" + entry.f2 + "</td><td>" + entry.f3 + "</td><td>" + entry.f4 + "</td><td>" + entry.s + "</td></tr>");
		}
		document.getElementById('nowpage').innerHTML = "第"+dst+"页 ";
		var totalpage = Math.ceil(obj.total / ENTRIES_PER_PAGE);
		document.getElementById('totalpage').innerHTML = "共" + totalpage + '页';
	});

};

function prevpage() {
	var page = JSON.parse($('#data').val()).page - 1;
	if (page < 1)
		return alert("已经是第一页");
	return topage(page);
};

function nextpage() {
	var page = JSON.parse($('#data').val()).page;//当前2，最多容纳100
	var total = parseInt($('#total').val());
	if (page * ENTRIES_PER_PAGE >= total)
		return alert("已经是最后一页");
	return topage(page + 1);
};