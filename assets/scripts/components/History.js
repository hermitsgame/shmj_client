
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];

		cc.vv.utils.addClickEvent(item, this.node, 'History', 'onBtnItemClicked');

		this._temp = item;
		content.removeChild(item, false);

		var self = this;

		this.node.on("rb-updated", function(event) {
            var id = event.detail.id;
            self.refresh(id);
        });
    },

	onEnable: function() {
		var stats = this.node.getChildByName('stats');
		var radios = [ 'btn_today', 'btn_week', 'btn_month' ];
		var id = 0;

		for (var i = 0; i < radios.length; i++) {
			var btn = stats.getChildByName(radios[i]).getComponent('RadioButton');

			if (btn.checked) {
				id = i;
				break;
			}
		}

		this.refresh(id);
    },

	onBtnItemClicked: function(event) {
		var item = event.target;
		var detail = cc.find('Canvas/detail_history');

		detail.roomInfo = item.roomInfo;
		detail.active = true;
    },

	refresh: function(id) {
		var self = this;
		var dayArr = [ 0, 6, 30 ];

		var data = {
			days : dayArr[id]
		};

		cc.vv.pclient.request_apis('list_user_history', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			var history = ret.data;
			var rooms = history.rooms;

			for(var i = 0; i < rooms.length; ++i){
                var numOfSeats = rooms[i].info.seats.length;
                for(var j = 0; j < numOfSeats; ++j){
                    var s = rooms[i].info.seats[j];
                    s.name = new Buffer(s.name,'base64').toString();
                }
            }

			self.showHistories(history);
		});
    },

	getItem: function(index) {
		var content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._temp);

        content.addChild(node);
        return node;
    },

	shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

	showHistories: function(history) {
		var content = cc.find('items/view/content', this.node);
		var data = history.rooms;
		var stats = this.node.getChildByName('stats');
		var balance = stats.getChildByName('balance').getComponent(cc.Label);
		var game = stats.getChildByName('game').getComponent(cc.Label);
		var zimo = stats.getChildByName('zimo').getComponent(cc.Label);
		var gk = stats.getChildByName('gk').getComponent(cc.Label);
		var dp = stats.getChildByName('dp').getComponent(cc.Label);

		balance.string = history.balance;
		game.string = history.game_num;
		zimo.string = history.zimo;
		dp.string = history.dp;
		gk.string = history.gk;

		for (var i = 0; i < data.length; i++) {
			var room = data[i];
			var info = room.info;
			var item = this.getItem(i);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var date = item.getChildByName('date').getComponent(cc.Label);
			var time = item.getChildByName('time').getComponent(cc.Label);
			var roomid = item.getChildByName('roomid').getComponent(cc.Label);
			var club = item.getChildByName('club').getComponent(cc.Label);
			var score = item.getChildByName('score').getComponent(cc.Label);
			var head = cc.find('icon/head', item);

			roomid.string = '房间号：' + room.room_tag;
			desc.string = info.huafen + '/' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';
			club.string = room.club_name + '';
			score.string = room.score;
			cc.vv.utils.loadImage(room.club_logo, head);

			var ctime = room.create_time * 1000;

			date.string = this.getDate(ctime);
			time.string = this.getTime(ctime);

			item.roomInfo = room;
		}

		this.shrinkContent(content, data.length);
    },

	getDate: function(time) {
		var today = new Date();

		today.setHours(0);
	    today.setMinutes(0);
	    today.setSeconds(0);
	    today.setMilliseconds(0);

		var utoday = today.getTime();
		var uyday = utoday - 24 * 3600 * 1000;

		if (time >= utoday)
			return '今天';
		else if (time >= uyday)
			return '昨天';

		var date = new Date(time);
		var datetime = '{0}月{1}日';
		var month = date.getMonth() + 1;
		var day = date.getDate();

		return datetime.format(month, day);
    },

	getTime: function(time) {
		var date = new Date(time);
		var datetime = '{0}:{1}';
		var h = date.getHours();
		var m = date.getMinutes();

        h = h >= 10 ? h : ('0' + h);
        m = m >= 10 ? m : ('0' + m);

		return datetime.format(h, m);
    },
});

