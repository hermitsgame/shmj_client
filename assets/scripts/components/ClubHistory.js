
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('histories/view/content', this.node);
		var item = content.children[0];
		var btn_detail = item.getChildByName('btn_detail');

		cc.vv.utils.addClickEvent(btn_detail, this.node, 'ClubHistory', 'onBtnHistoryClicked');

		this._temp = item;
		content.removeChild(item, false);

		var btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'ClubHistory', 'onBtnClose');
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnClose: function() {
		this.node.active = false;
	},

	onBtnHistoryClicked: function(event) {
		var item = event.target.parent;
		var detail = cc.find('Canvas/detail_history');

		detail.roomInfo = item.roomInfo;
		detail.active = true;
    },

	refresh: function() {
		var self = this;

		var data = cc.vv.historyParam;

		cc.vv.pclient.request_apis('list_club_history', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			var histories = ret.data;

			for(var i = 0; i < histories.length; ++i){
                var numOfSeats = histories[i].info.seats.length;
                for(var j = 0; j < numOfSeats; ++j){
                    var s = histories[i].info.seats[j];
                    s.name = new Buffer(s.name,'base64').toString();
                }
            }

			self.showHistories(histories);
		});
    },

	getItem: function(index) {
		var content = cc.find('histories/view/content', this.node);

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

	showHistories: function(data) {
		var content = cc.find('histories/view/content', this.node);

		for (var i = 0; i < data.length; i++) {
			var history = data[i];
			var item = this.getItem(i);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var time = item.getChildByName('time').getComponent(cc.Label);
			var roomid = item.getChildByName('roomid').getComponent(cc.Label);
			var gamenum = item.getChildByName('gamenum').getComponent(cc.Label);
			var seats = item.getChildByName('seats');

			var info = history.info;
			var index = 0;

			time.string = cc.vv.utils.dateFormat(history.create_time * 1000);
			roomid.string = '房间号：' + history.room_id;
			gamenum.string = '局数：' + info.game_num;
			desc.string = info.huafen + '/' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';

			for (var j = 0; j < seats.childrenCount && j < info.seats.length; j++) {
				var seat = seats.children[j];
				var name = seat.getChildByName('name').getComponent(cc.Label);
				var score = seat.getChildByName('score').getComponent(cc.Label);
				var head = cc.find('icon/head', seat).getComponent('ImageLoader');
				var sd = info.seats[j];

				seat.active = true;
				name.string = sd.name;
				score.string = sd.score >= 0 ? '+' + sd.score : sd.score;
				head.setUserID(sd.uid);

				index += 1;
			}

			for (var j = index; j < seats.childrenCount; j++) {
				var seat = seats.children[j];

				seat.active = false;
			}

			item.roomInfo = history;
		}

		this.shrinkContent(content, data.length);
    },
});

