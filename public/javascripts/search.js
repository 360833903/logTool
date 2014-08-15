var ENTRIES_PER_PAGE = 30;

$(document).ready(function() {
	var date = new Date();
	var datestr = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
	$('#start').val(datestr);
	$('#end').val(datestr);
  	for(var i=1; i <= 55; ++i)
    	$('#server').append("<option value="+i+">"+i+"区"+"</option>");
	$("#mytable tr:even").addClass("alt");
});

function checkWorld(js,x) {
	if(x == js.length) return;
	$.get("/basic_service/?w="+$("#area").val()+"&js="+js,function(resp){
		eval(resp);
		alert(JSON.stringify(itemgroup_info));
		checkWorld(js,++x);
	});
}

function formatDate(date) {
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

function dealStr(str) {
	var length = str.length, strArray = [];
	for (var i = 0; i < length; i++) {
		var aChar = str.charAt(i);
		if (aChar != '\\')
			strArray.push(aChar);
	}
	return strArray.join('');
};

function compareEntry(a, b) {
	return a.f1 > b.f1 ? 1 : -1;
};

function toTimeStamp(datestr) {
	var datearr = datestr.split('-', 3);
	var date = new Date(parseInt(datearr[0]), parseInt(datearr[1]) - 1, parseInt(datearr[2]));
	return date.getTime() / 1000;
};

function check() {
	if($('#area').val()==0)
		return alert("请选择简繁体");
	var category = $('#category').val(); 
	if($('#server').val()==0)
		return alert("请选择所在区");
	if($('#wuid').val() == null || $('#wuid').val()=="")
		return alert("请输入wuid");
	if(category==0)
		return alert("请选择日志类型");
	if($('#start').val() == null || $('#start').val()=="")
		return alert("请选择开始时间");
	if($('#end').val() == null || $('#end').val()=="")
		return alert("请选择结束时间");
	if ($('#end').val() < $('#start').val())
		return alert("结束时间应该在开始时间之后");
	//console.log(toTimeStamp($('#start').val()));
	
	$.post('/test', {
		area: $('#area').val(),
		server: $('#server').val(),
		wuid: $('#wuid').val(),
		category: $('#category').val(),
		start: toTimeStamp($('#start').val()),
		end: toTimeStamp($('#end').val())
	}, function(result){

		//$('#data').val(result);
		$('#catetemp').val(category);
		var obj = $.parseJSON(result);
		var getdocs = obj.docs;
		var tempArr = [];
		for (var en in getdocs) {
			var enobj = getdocs[en];
			if(category == 4){
				var entry_str = JSON.stringify(enobj);
		                var crumb0 = entry_str.match(/\b302\d+?\b/g);
		                var crumb1 = entry_str.match(/\b3001[7|8]\b/g);
                		if(crumb0==null && crumb1==null){
					continue;
				}else{
					enobj.f1 = enobj.f1 * 1000;
					tempArr.push(enobj);
					obj.total = tempArr.length;
					continue;
				}

			}
			enobj.f1 = enobj.f1 * 1000;
		}
//		alert(JSON.stringify(obj.docs));
//		alert(obj.total);
		if(category == 4){
			obj.docs = tempArr;
			getdocs = tempArr;
		}
		getdocs.sort(compareEntry);
		$('#data').val(JSON.stringify(obj.docs));
		$('#page').val(1);
		$('#total').val(obj.total);
		$("#mytable tr").remove();
		var limit = obj.total > ENTRIES_PER_PAGE ? ENTRIES_PER_PAGE : obj.total;

		if (category == 1) {
			$('#mytable').append("<tr><th width='80px'>序号</th><th width='200px'>时间</th><th width='140px'>事件</th><th width='100px'>钻石变化</th><th width='120px'>钻石数量</th></tr>");
			generateCate1(0, limit, getdocs);
		}
		else if(category == 2) {
			$('#mytable').append("<tr><th width='50px'>序号</th><th width='160px'>时间</th><th width='80px'>事件</th><th min-width='800px'>卡牌</th></tr>");
			generateCate2(0, limit, getdocs);
		}else if (category == 3) {
                        $('#mytable').append("<tr><th width='80px'>序号</th><th width='200px'>时间</th><th width='140px'>事件</th><th width='100px'>球票变化</th><th width='120px'>球票数量</th></tr>");
                        generateCate3(0, limit, getdocs);
                }else if (category == 4) {
                        $('#mytable').append("<tr><th width='80px'>序号</th><th width='200px'>时间</th><th width='140px'>事件</th><th min-width='800px'>碎片</th></tr>");
                        generateCate4(0, limit, getdocs);			
		}else if (category == 5) {
                        $('#mytable').append("<tr><th width='80px'>序号</th><th width='200px'>时间</th><th width='140px'>转盘</th><tr>");
                        generateCate5(0, limit, getdocs);
               
                }else if (category == 6) {
                        $('#mytable').append("<tr><th width='80px'>序号</th><th width='200px'>时间</th><th width='140px'>特训卡</th><tr>");
                        generateCate6(0, limit, getdocs);
                }




		$('#prevpagebt').attr('disabled', false);
		$('#nextpagebt').attr('disabled', false);
		var totalpage = Math.ceil(obj.total / ENTRIES_PER_PAGE);
		document.getElementById('nowpage').innerHTML = "第1页 ";
		document.getElementById('totalpage').innerHTML = "共" + totalpage + '页';
	});
};

function topage(tarPage) {
	$("#mytable tr:not(:first)").remove();
	$('#page').val(tarPage);
	var docs = $.parseJSON($('#data').val());

	var total = parseInt($('#total').val());
	var limit = total - (tarPage - 1) * ENTRIES_PER_PAGE > ENTRIES_PER_PAGE ? ENTRIES_PER_PAGE : total - (tarPage - 1) * ENTRIES_PER_PAGE;
	var category = parseInt($('#category').val());
	if (category == 1)
		generateCate1((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);
	else if (category == 2)
		generateCate2((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);
        else if (category == 3)
                generateCate3((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);
	else if (category == 4)
                generateCate4((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);

        else if (category == 5)
                generateCate5((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);

        else if (category == 6)
                generateCate6((tarPage - 1) * ENTRIES_PER_PAGE, limit + (tarPage - 1) * ENTRIES_PER_PAGE, docs);


	document.getElementById('nowpage').innerHTML = "第"+tarPage+"页 ";
};

function generateCate1(start, end, docs) {
	for (var i = start; i < end; i++) {
		var entry = docs[i];
		//console.log(JSON.stringify(entry));
		var dateStr = formatDate(new Date(entry.f1));
		var typestr;
		if (consume_type[entry.f3] == null) {
			typestr = '未知';
			//onsole.log(JSON.stringify(entry));
		}
		else
			typestr = consume_type[entry.f3];
		if (entry.f0==121) {
			var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry["30004"], 0) + "</td><td></td></tr>";
			$('#mytable').append(str);
		}
		else if (entry.f0==145) {
			var array = entry.other;
			var amount;
			for (var item in array) {
				var inner = array[item];
				if (inner.i == "30004")
					amount = inner.a;
			}
			var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>登录</td><td></td><td>" + (amount == undefined? 0: amount) + "</td></tr>";
			$('#mytable').append(str);
		} else if (entry.f0==136) {
			if(entry.f3=="202"){
				var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry.f5, 1) + "</td><td></td></tr>";
			}else{
				var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry["30004"], 1) + "</td><td></td></tr>";
			}
			$('#mytable').append(str);
		}

	}

};

function generateCate2(start, end, docs) {
	for (var i = start; i < end; i++) {
		var entry = docs[i];
		var typestr;
		if (consume_type[entry.f3] == null) {
			typestr = '未知';
			//console.log(JSON.stringify(entry));
		}
		else
			typestr = consume_type[entry.f3];
		var dateStr = formatDate(new Date(entry.f1));
		var str;
		var canparse = false;
		var cards;
		if (entry.other) {//为null
			try {
				cards = JSON.parse(entry.other);
				canparse = true;
			} catch(err) {
				try {
					cards = JSON.parse(entry.other.split(']}:', 2)[1]);
				} catch(err) {
					continue;
				}
				canparse = false;
			}
		}
		if (canparse || entry.main) {
			if (entry.f0 == 122)
				str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + parseCardFor122(cards, entry.f3, entry.main, entry) + "</td></tr>";
			else if(entry.f0 == 135)
				str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td style='color:#008040;'>" + typestr + "</td><td>" + parseCardFor135(cards, entry.f3) + "</td></tr>";
			$('#mytable').append(str);
		}
		else {
			if (entry.f0 == 126)
				str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td style='color:#008040;'>" + typestr + "</td><td>" + parseCardForNIU(entry) + "</td></tr>";
			else
				str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td style='color:#008040;'>" + typestr + "</td><td>" + parseCardForNIU(entry) + "</td></tr>";
			$('#mytable').append(str);
		}
		
	}
};

function generateCate3(start, end, docs) {
        for (var i = start; i < end; i++) {
                var entry = docs[i];
                //console.log(JSON.stringify(entry));
                var dateStr = formatDate(new Date(entry.f1));
                var typestr;
                if (consume_type[entry.f3] == null) {
                        typestr = '未知';
                        //onsole.log(JSON.stringify(entry));
                }
                else
                        typestr = consume_type[entry.f3];
                if (entry.f0==121) {
                        var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry["30014"], 0) + "</td><td></td></tr>";
                        $('#mytable').append(str);
                }
                else if (entry.f0==145) {
                        var array = entry.other;
                        var amount;
                        for (var item in array) {
                                var inner = array[item];
                                if (inner.i == "30014")
                                        amount = inner.a;
                        }
                        var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>登录</td><td></td><td>" + (amount == undefined? 0: amount) + "</td></tr>";
                        $('#mytable').append(str);
                } else if (entry.f0==136) {
                        if(entry.f3=="231" || entry.f3=="101"){
                                var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry.f5, 1) + "</td><td></td></tr>";
                        }else{
                                var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + digit2Str(entry["30014"], 1) + "</td><td></td></tr>";
                        }
			$('#mytable').append(str);
                }

        }

};

function generateCate4(start, end, docs) {
        for (var i = start; i < end; i++) {
                var entry = docs[i];
                //console.log(JSON.stringify(entry));
                var dateStr = formatDate(new Date(entry.f1));
                var typestr;
                if (consume_type[entry.f3] == null) {
                        typestr = '未知';
                        //onsole.log(JSON.stringify(entry));
                }
                else
                        typestr = consume_type[entry.f3];

		var entry_str = JSON.stringify(entry);	
		var crumb=[];
		var crumb0 = entry_str.match(/\b302\d+?\b/g);
		var crumb1 = entry_str.match(/\b3001[7|8]\b/g);
		if(crumb0==null && crumb1==null) continue;
		if(crumb0==null) crumb = crumb1;
		else if(crumb1==null){
			crumb = crumb0;
		}else{
			crumb = crumb0.concat(crumb1);
		}
		var crumb_info = "";
                for(var k =0; k<crumb.length; k++){
			if(entry.f0 == 145){
				for(j in entry.other){
					if(entry.other[j].i == crumb[k]){
						crumb_info += item_value[crumb[k]] + ":" + entry.other[j].a + ",";
					}
				}
			}else{
				if(entry[crumb[k]] && entry[crumb[k]] > 0){
					crumb_info += item_value[crumb[k]] + ":" + entry[crumb[k]] + ",";
					continue;
				}
				if(entry.f4 == crumb[k]){
					crumb_info += item_value[crumb[k]] + ":" + entry.f5+",";
					continue;
				}
			}
		}
		if (entry.f0==121) {
                        var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + crumb_info + "</td></tr>";
                        $('#mytable').append(str);
                } else if (entry.f0==136) {
			var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td style='color:#008040;'>" + typestr + "</td><td>" + crumb_info + "</td></tr>";
                        $('#mytable').append(str);
                } else if (entry.f0==145) {
                        var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + typestr + "</td><td>" + crumb_info + "</td></tr>";
                        $('#mytable').append(str);			
		}

        }

};
function generateCate5(start, end, docs) {
        for (var i = start; i < end; i++) {
                var entry = docs[i];
                //console.log(JSON.stringify(entry));
                var ring="";
                var dateStr = formatDate(new Date(entry.f1));
		var o = JSON.parse(entry.other);
		for(var j=0; j<o.l.length; j++){
			var index = parseInt(o.l[j].i);
			ring += lucky_ring_list[index-1].i[0].n+" x "+lucky_ring_list[index-1].i[0].a+"<br />";
		}
		var tmp = JSON.stringify(ring);
		eval('var r = '+tmp+';');
		var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + r + "</td></tr>";
		$('#mytable').append(str);	
	}
}

function generateCate6(start, end, docs) {
        for (var i = start; i < end; i++) {
                var entry = docs[i];
                //console.log(JSON.stringify(entry));
                var dateStr = formatDate(new Date(entry.f1));

                var str = "<tr><td>" + (i+1) + "</td><td>" + dateStr + "</td><td>" + entry.f4 + "</td></tr>";
                $('#mytable').append(str);
        }
}

function prevpage() {
	var page = parseInt($('#page').val()) - 1;
	if (page < 1)
		return alert("已经是第一页");
	return topage(page);
};

function nextpage() {
	var page = parseInt($('#page').val());//当前2，最多容纳100
	var total = parseInt($('#total').val());
	if (page * ENTRIES_PER_PAGE >= total)
		return alert("已经是最后一页");
	return topage(page + 1);
};

function parseCardFor122(cardarr, cate, main, entry) {
	var str = "";
	if (cate == 301 || cate == 302 || cate == 304) {
		for (var i in cardarr) {
			var card = cardarr[i];
			str += '卡' + (parseInt(i)+1) + ':';
			str += getCardStr(card);
		}
	} else if (cate == 303) {
		if (main != null) {
			str += '主卡:';
			var mainCard = JSON.parse(main);
			for (var i in mainCard){
				str += getCardStr(mainCard[i]);
			}
		}
		var cnt = 0;
		for (var i in cardarr) {
			var tarr = cardarr[i];
			console.log(tarr);
			for (var j in tarr) {
				var card = tarr[j];
				str += '卡' + (++cnt) + ':';
				str += getCardStr(card);
			}
		}
	}
	//console.log(JSON.stringify(entry));
	return str;
};

function parseCardFor135(cardarr, cate) {
	var str = "";
	for (var i in cardarr) {
		var card = cardarr[i];
		if (cate == 108)
			str += getCardStr(card);
		else
			str += '【' + card.i + ' ' + card_list[card.i] + ' 数量:' + card.a + '】';
	}
	return str;
};

function parseCardForNIU(entry) {
	if (!entry.f4)
		return '';
	var str = '【';
	str += entry.f4 + ' ' + card_list[entry.f4] + '】';
	if (entry.f5 != undefined) {
		str += '【' + entry.f5 + ' ' + card_list[entry.f5] + '】【';
		str += entry.f6 + ' ' + card_list[entry.f6] + '】【';
		str += entry.f7 + ' ' + card_list[entry.f7] + '】【';
		str += entry.f8 + ' ' + card_list[entry.f8] + '】【';
		str += entry.f9 + ' ' + card_list[entry.f9] + '】【';
		str += entry.f10 + ' ' + card_list[entry.f10] + '】【';
		str += entry.f11 + ' ' + card_list[entry.f11] + '】【';
		str += entry.f12 + ' ' + card_list[entry.f12] + '】【';
		str += entry.f13 + ' ' + card_list[entry.f13] + '】';
	}
	return str;
};

function getCardStr(card) {
	var str = '【';
	str += card.i + ' ' + card_list[card.i] + ' LV' + card.lv + ' S:' + card.s + ' AM:' + card.am + '】';
	return str;
};

function digit2Str(digit, postive) {
	if (digit == 0)
		return digit;
	else
		return postive? '+' + digit: '-' + digit;
};

function getMainCardStr(card){
    var str = '【';
    str += card[0].i + ' ' + card_list[card[0].i] + ' LV' + card[0].lv + ' S:' + card[0].s + ' AM:' + card[0].am + '】';
    return str;
}
