var tfu = {
	cookie: 0,
	roomBase: {},
	roomId: '1ddf721f-f7e2-44c0-8414-1abef9627b9b',

	init: function() {
		console.clear();
		console.log('Init TixBot');
		$('.Navigation [data-rid='+this.roomId+']').click();

		$('.Room[data-rid]').each(function() {
			var roomId = $(this).attr('data-rid');
			if(tfu.roomBase[roomId] === undefined) {
				tfu.roomBase[roomId] = {'type': '', 'author': '', 'time': 0, 'count': 0};
			}
		});

		setInterval(function() {
			$('.Room[data-rid='+tfu.roomId+'] .log').each(function() {
				var $logObject = $(this);
				var lastActiveObj = $logObject.children().last();
				var roomId = $logObject.closest('div.Room').attr('data-rid');
				if(lastActiveObj.attr('data-author') != tfu.roomBase[roomId]['author'] || lastActiveObj.attr('data-time') != tfu.roomBase[roomId]['time'] || lastActiveObj.find('.line').length != tfu.roomBase[roomId]['count']) {
					console.warn('It is found out changes in log');

					var goFindNew = false;
					$logObject.children().each(function() {
						var currActiveObj = $(this);
						var currActiveType = currActiveObj.hasClass('message') ? 'message' : 'event';
						if(goFindNew) {
							if(currActiveType == 'message') {
								currActiveObj.find('[data-time]').each(function() {
									tfu.messageAction($(this));
								});
							}
							else {
								tfu.eventAction(currActiveObj);
							}
						}

						if(currActiveType == tfu.roomBase[roomId]['type'] && currActiveObj.attr('data-time') == tfu.roomBase[roomId]['time'] && currActiveObj.find('.line').length == tfu.roomBase[roomId]['count']) {
							goFindNew = true;
						}
					});

					tfu.roomBase[roomId]['type'] = lastActiveObj.hasClass('message') ? 'message' : 'event';
					tfu.roomBase[roomId]['author'] = lastActiveObj.attr('data-author');
					tfu.roomBase[roomId]['time'] = lastActiveObj.attr('data-time');
					tfu.roomBase[roomId]['count'] = lastActiveObj.find('.line').length;
					var maxOnline = Object.keys(C.rooms[roomId].users).length;
					if(tfu.roomBase[roomId]['maxOnline']===undefined || tfu.roomBase[roomId]['maxOnline']['count'] < maxOnline) {
						tfu.roomBase[roomId]['maxOnline'] = {'count': maxOnline, 'date': new Date().getTime()};
					}
					if(!goFindNew) {
						if(tfu.roomBase[roomId]['type'] == 'message') {
							tfu.messageAction(lastActiveObj.find('[data-time]').last());
						}
						else {
							tfu.eventAction(lastActiveObj);
						}
					}
				}
			});
			localStorage.setItem('tfu.roomBase', JSON.stringify(tfu.roomBase));
		}, 150);
	},

	eventAction: function(eventObj) {
		var unixTime = new Date().getTime();
		var roomId = this.getRoomId(eventObj);

		if(eventObj.find('.text').last().text().indexOf(' в комнату') > -1) {
			var author = eventObj.find('.author').last().text();
			this.send('Hello ' + author + '!', roomId);
		}
		else if(eventObj.find('.text').last().text().indexOf(' из комнаты') > -1 || eventObj.find('.text').last().text().indexOf(' из чата') > -1) {
			/* Do something after leave user */
		}
	},
	messageAction: function(msgObj) {
		var msg = (msgObj.text()).trim();
		if(msg.substr(0,1) == '!') {
			var roomId = this.getRoomId(msgObj);
			var cmd = msg.substr(1).split(' ');
			cmd[0] = cmd[0].toLowerCase();
			console.log('command: ' + cmd[0] + ' room: ' + roomId);

			switch(cmd[0]) {
				case 'rule':
				case 'rules':
				case 'правила':
				case 'правило':
					tfu.send("Правила комнаты!\n- Их пока нет");
					break;
				case 'hi':
				case 'hello':
				case 'хай':
				case 'привет':
					tfu.send("Всем привет");
					break;
				case 'bye':
				case 'пока':
					tfu.send('С вами прощаются и говорят всем пока!');
					break;
				case 'say':
				case 'сказать':
				case 'скажи':
					tfu.deleteAuthorCmd(msgObj);
					if(cmd.length > 1) {
						tfu.send("- " + tfu.replaceUser(msgObj, msg.substr(cmd[0].length + 2)) + "\n ( сказал(а): +" + (msgObj.parent().parent().find('.author').text()) + " )");
					}
					break;
				case 'gender':
				case 'sex':
				case 'род':
				case 'пол':
					var userData;
					var requestUser = msgObj.find('span.user');
					if(requestUser.length > 0) {
						userData = tfu.getUserData(requestUser[0].getAttribute('data-id'));
						if(userData == false)
							userData = tfu.getUserData(tfu.getAuthorID(msgObj));
					}
					else {
						userData = tfu.getUserData(tfu.getAuthorID(msgObj));
					}
					tfu.send("У " + userData['name'] + " пол: " + (userData['sex'] == 'm' ? 'мужской' : 'женский'));
					break;
				case 'info':
				case 'author':
				case 'инфо':
				case 'автор':
					tfu.send("Автор:\n\
						- Вафлан (Руслан)\n\
						\n\
						Идеи и помошь:\n\
						- St.Niga Alex\n\
						- TimeLard\n\
						- Igor Petrovich\n\
						\n\
						Developer room: \n\
						https://tixchat.com/room/1ddf721f-f7e2-44c0-8414-1abef9627b9b\
					");
					break;
				default:
					tfu.send("Команды комнаты:\n\
						!rule - правило комнаты\n\
						!hi - сказать с добрым временем суток\n\
						!bye - сказать всем пока\n\
						!say [текст] - повторяет то что напишете\n\
						!gender [+Ник] - сообщит пол\n\
					");
					break;
			}
		}
	},

	deleteAuthorCmd: function(msgObj) {
		console.log("Command init by " + msgObj.parent().parent().find('.author').text());
		msgObj.parent().children('.deleteMessage').click();
	},
	send: function(text, chatId) {
		if(chatId === undefined) {
			chatId = this.roomId;
		}
		$('.Room[data-rid='+chatId+'] .compose .Input').val(text);
		$('.Room[data-rid='+chatId+'] .compose .Button').click();
	},
	replaceUser: function(html, text) {
		var userList = html.find('.user');
		for(key in userList) {
			if(userList.hasOwnProperty(key) && key <= 4294967294) {
				text = text.replace(userList[key].innerHTML.trim(), '+'+userList[key].innerHTML.trim());
			}
		}
		return text;
	},
	getRoomId: function(ActiveObj) {
		return ActiveObj.closest('div.Room').attr('data-rid');
	},
	getAuthorID: function(msgObj) {
		return msgObj.parent().parent().find('.author').attr('data-id');
	},
	getUserData: function(id, full) {
		if(C.Room.objects[this.roomId].users[id] !== undefined) {
			if(full === undefined)
				return C.Room.objects[this.roomId].users[id].data;
			return C.Room.objects[this.roomId].users[id];
		}
		return false;
	}
};



setTimeout("tfu.init()", 10000);