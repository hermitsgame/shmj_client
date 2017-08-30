
cc.Class({
    extends: cc.Component,

    properties: {
		_temp : null,
    },

    onLoad: function() {
		var content = cc.find('items/view/content', this.node);
		var item = content.children[0];
		var btn_replay = item.getChildByName('btn_replay');
		var btn_share = item.getChildByName('btn_share');

		cc.vv.utils.addClickEvent(btn_replay, this.node, 'DetailHistory', 'onBtnReplayClicked');
		cc.vv.utils.addClickEvent(btn_share, this.node, 'DetailHistory', 'onBtnShareClicked');

		this._temp = item;
		content.removeChild(item, false);
    },

	onEnable: function() {
		this.refresh();
    },

	onBtnBackClicked: function() {
		this.node.active = false;
	},

	onBtnShareClicked: function(event) {

    },

	onBtnReplayClicked: function(event) {
		var game = event.target.parent.game;
		var id = game.id;
		var roomInfo = this.node.roomInfo;

		console.log('onBtnReplayClicked');

		cc.vv.pclient.request_apis('get_detail_of_game', { id : id }, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			var data = ret.data;

            data.base_info = JSON.parse(data.base_info);
            data.action_records = JSON.parse(data.action_records);

            cc.vv.gameNetMgr.prepareReplay(roomInfo, data);
            cc.vv.replayMgr.init(roomInfo, data);
            cc.director.loadScene("mjgame"); 
        });
    },

	refresh: function() {
		var self = this;
		var roomInfo = this.node.roomInfo;

		var data = {
			room_id : roomInfo.room_id,
			club_id : roomInfo.club_id,
			create_time : roomInfo.create_time
		};

		cc.vv.pclient.request_apis('get_games_of_room', data, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.showItems(roomInfo, ret.data);
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

	showItems: function(roomInfo, data) {
		var content = cc.find('items/view/content', this.node);
		var title = this.node.getChildByName('title');
		var desc = title.getChildByName('desc').getComponent(cc.Label);
		var roomid = title.getChildByName('roomid').getComponent(cc.Label);
		var info = roomInfo.info;

		roomid.string = '房间号：' + roomInfo.room_id;
		desc.string = info.huafen + '' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';

		for (var i = 0; i < data.length; i++) {
			var game = data[i];
			var item = this.getItem(i);
			var time = item.getChildByName('time').getComponent(cc.Label);
			var seats = item.getChildByName('seats');

			var index = 0;
			var result = JSON.parse(game.result);

			time.string = cc.vv.utils.dateFormat(game.create_time * 1000);

			for (var j = 0; j < seats.childrenCount && j < info.seats.length; j++) {
				var seat = seats.children[j];
				var name = seat.getChildByName('name').getComponent(cc.Label);
				var score = seat.getChildByName('score').getComponent(cc.Label);
				var sd = info.seats[j];
				var _score = result[j];

				seat.active = true;

				name.string = sd.name;
				score.string = _score >= 0 ? '+' + _score : _score;

				index += 1;
			}

			for (var j = index; j < seats.childrenCount; j++) {
				var seat = seats.children[j];

				seat.active = false;
			}

			item.game = game;
		}

		this.shrinkContent(content, data.length);
    },
});

