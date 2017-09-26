
cc.Class({
    extends: cc.Component,

    properties: {
 		_temp: null,
    },
 
    onLoad: function () {
        var content = cc.find('recommend/items/view/content', this.node);
		var item = content.children[0];
		
		cc.vv.utils.addClickEvent(item, this.node, 'Discover', 'onBtnItem');

        this._temp = item;
		content.removeChild(item, false);

        var btn_fb = cc.find('top/btn_fb', this.node);

        cc.vv.utils.addClickEvent(btn_fb, this.node, 'Discover', 'onBtnFB');
    },

    onBtnItem: function(event) {
        var item = event.target;
        var room_tag = item.room_tag;

        cc.vv.userMgr.enterRoom(room_tag);
    },

    onBtnFB: function() {
        cc.vv.audioMgr.playButtonClicked();

        var fb = cc.find('Canvas/feedback');

        cc.vv.utils.showDialog(fb, 'body', true);
    },

	onEnable: function() {
		this.refresh();
    },

	refresh: function() {
		var self = this;

		console.log('list_recommend_rooms');

		cc.vv.pclient.request_apis('list_recommend_rooms', {}, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			console.log('showItems');
			console.log(ret.data);
			self.showItems(ret.data);
		});
    },

	getItem: function(index) {
		var content = cc.find('recommend/items/view/content', this.node);

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

	showItems: function(data) {
		var content = cc.find('recommend/items/view/content', this.node);

		for (var i = 0; i < data.length; i++) {
			var room = data[i];
			var info = room.base_info;
			var item = this.getItem(i);

			var club = item.getChildByName('club').getComponent(cc.Label);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var roomid = item.getChildByName('room').getComponent(cc.Label);
			var headcount = item.getChildByName('headcount').getComponent(cc.Label);
			var head = cc.find('icon/head', item);

			club.string = room.club_name + '俱乐部';
			desc.string = info.huafen + '/' + info.huafen + (info.maima ? '带苍蝇' : '不带苍蝇') + info.maxGames + '局';
			roomid.string = '房间号' + room.room_tag;

			cc.vv.utils.loadImage(room.club_logo, head);

			item.room_tag = room.room_tag;
		}

		this.shrinkContent(content, data.length);
    },
});
 