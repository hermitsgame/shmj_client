
cc.Class({
    extends: cc.Component,

    properties: {
		_tempRoom : null,

		_timer : -1,
    },

    onLoad: function() {
		var content = cc.find('rooms/view/content', this.node);
		var item = content.children[0];
		var addClickEvent = cc.vv.utils.addClickEvent;
		var btn_edit = item.getChildByName('btn_edit');
		var btn_destroy = item.getChildByName('btn_destroy');
        var btn_play = item.getChildByName('btn_play');
		var seats = item.getChildByName('seats');

		for (var i = 0; i < seats.childrenCount; i++) {
			var seat = seats.children[i];
            var btnKick = seat.getChildByName('btnKick');

			addClickEvent(btnKick, this.node, 'Admin', 'onBtnKickClicked');
		}

		addClickEvent(btn_edit, this.node, 'Admin', 'onBtnEditClicked');
		addClickEvent(btn_destroy, this.node, 'Admin', 'onBtnDestroyClicked');
        addClickEvent(btn_play, this.node, 'Admin', 'onBtnPlayClicked');

		this._tempRoom = item;
		content.removeChild(item, false);
    },

	onEnable: function() {
		this.refresh();

		this._timer = 0;
    },

    onBtnKickClicked: function(event) {
        console.log('onBtnKickClicked');
    },

    onBtnEditClicked: function(event) {
        console.log('onBtnEditClicked');
    },

    onBtnDestroyClicked: function(event) {
        console.log('onBtnDestroyClicked');
    },

    onBtnPlayClicked: function(event) {
        console.log('onBtnPlayClicked');

		var item = event.target.parent;
		var room = item.room;
        var pc = cc.vv.pclient;

        if (room.status == 'idle') {
            var data = {
    			roomid : room.id,
    			room_tag : room.room_tag
    		};

    		pc.request_apis('start_club_room', data, function(ret) {
    			if (!ret || ret.errcode != 0)
    				return;

    			self.refresh();
    	    });
        } else {

        }
    },
    
	onDisable: function() {
		this._timer = -1;
    },

	refresh: function() {
		var self = this;
		var club_id = cc.vv.userMgr.club_id;

		cc.vv.pclient.request_apis('list_club_rooms', { club_id : club_id }, function(ret) {
			if (!ret || ret.errcode != 0)
				return;

			self.showRooms(ret.data);
		});
    },

	getRoomItem: function(index) {
		var content = cc.find('rooms/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._tempRoom);

        content.addChild(node);
        return node;
    },

	shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

	showRooms: function(rooms) {
		var content = cc.find('rooms/view/content', this.node);

		for (var i = 0; i < rooms.length; i++) {
			var room = rooms[i];
			var players = room.players;
			var item = this.getRoomItem(i);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
            var btn_edit = item.getChildByName('btn_edit');
    		var btn_destroy = item.getChildByName('btn_destroy');
            var btn_play = item.getChildByName('btn_play');
			var seats = item.getChildByName('seats');
			var progress = item.getChildByName('progress').getComponent(cc.Label);
			var roomid = item.getChildByName('roomid').getComponent(cc.Label);
			
			var np = 0;

			for (var j = 0; j < players.length; j++) {
				var seat = seats.children[j];
				var p = players[j];
				var name = seat.getChildByName('name');
                var id = seat.getChildByName('id');
				var head = seat.getChildByName('head');
                var btnKick = seat.getChildByName('btnKick');
				var empty = p.id == 0;

				name.active = !empty;
                id.active = !empty;
				//ready.active = !empty && p.ready;
				head.active = !empty;
                btnKick.active = !empty;

				if (empty)
					continue;

                np += 1;

                seat.player = p;
				seat.room = room;

				name.getComponent(cc.Label).string = p.name;
				head.getComponent('ImageLoader').setUserID(p.id);
			}

			progress.string = room.num_of_turns + ' / ' + room.base_info.maxGames;

			roomid.string = 'ID:' + room.id;

			

            room.np = np;
			item.room = room;

            // btn_play.getComponent(cc.Button).interactable = np == 4;
			btn_play.getComponent('SpriteMgr').setIndex(room.status == 'idle' ? 0 : 1);
		}

		this.shrinkContent(content, rooms.length);
    },

	update: function(dt) {
		if (this._timer < 0)
			return;

		this._timer += dt;

		var time = Math.floor(this._timer);

		if (time >= 3) {
			this._timer = 0;
			this.refresh();
		}
    },
});

