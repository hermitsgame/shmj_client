
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
		this.refresh(0);
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

		console.log('history:');
		console.log(history);

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

			roomid.string = '房间号：' + room.room_tag;
			desc.string = info.huafen + '/' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';
			club.string = room.club_name + '';
			score.string = room.score;
			

			item.roomInfo = room;
		}

		this.shrinkContent(content, data.length);
    },
});

