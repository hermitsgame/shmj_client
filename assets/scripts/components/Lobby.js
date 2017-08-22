
cc.Class({
    extends: cc.Component,

    properties: {
		_tempRoom : null,

		_timer : -1,
		roomid : null,
    },

    onLoad: function() {
		var content = cc.find('rooms/view/content', this.node);
		var item = content.children[0];
		var addClickEvent = cc.vv.utils.addClickEvent;
		var btn_prepare = item.getChildByName('btn_prepare');
		var btn_leave = item.getChildByName('btn_leave');
		var seats = item.getChildByName('table');

		for (var i = 0; i < seats.childrenCount; i++) {
			var seat = seats.children[i];

			addClickEvent(seat, this.node, 'Lobby', 'onBtnSeatClicked');
		}

		addClickEvent(btn_prepare, this.node, 'Lobby', 'onBtnPrepareClicked');
		addClickEvent(btn_leave, this.node, 'Lobby', 'onBtnLeaveClicked');

		this._tempRoom = item;
		content.removeChild(item, false);
    },

	onEnable: function() {
		this.refresh();

		this._timer = 0;
    },

	onDisable: function() {
		this._timer = -1;
    },

	join_room: function(room, seatindex) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag,
			name : cc.vv.userMgr.userName,
			seatindex : seatindex
		};

		cc.vv.pclient.request_apis('join_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
    },

	leave_room: function(room) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag
		};

		cc.vv.pclient.request_apis('leave_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
    },

	prepare: function(room) {
		var self = this;

		var data = {
			roomid : room.id,
			room_tag : room.room_tag
		};

		cc.vv.pclient.request_apis('prepare_club_room', data, function(ret) {
			if (!ret)
				return;

			if (ret.errcode != 0) {
				cc.vv.alert.show(errmsg);
				return;
			}

			self.refresh();
		});
    },

	onBtnSeatClicked: function(event) {
		var seat = event.target;
		var room = seat.room;
		var player = seat.player;

		if (this.roomid != null)
			return;

		this.join_room(room, player.seatindex);
    },

	onBtnPrepareClicked: function(event) {
		var item = event.target.parent;
		var room = item.room;

		this.prepare(room);
    },

	onBtnLeaveClicked: function(event) {
		var item = event.target.parent;
		var room = item.room;

		this.leave_room(room);
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
		var uid = cc.vv.userMgr.userId;

		this.roomid = null;

		for (var i = 0; i < rooms.length; i++) {
			var room = rooms[i];
			var players = room.players;
			var item = this.getRoomItem(i);
			var desc = item.getChildByName('desc').getComponent(cc.Label);
			var seats = item.getChildByName('table');
			var btn_prepare = item.getChildByName('btn_prepare');
			var btn_leave = item.getChildByName('btn_leave');
			var progress = item.getChildByName('progress').getComponent(cc.Label);
			var found = false;

			for (var j = 0; j < players.length; j++) {
				var seat = seats.children[j];
				var p = players[j];
				var name = seat.getChildByName('name');
				var head = cc.find('icon/head', seat);
				var ready = seat.getChildByName('ready');
				var empty = p.id == 0;

				seat.player = p;
				seat.room = room;

				name.active = !empty;
				ready.active = !empty && p.ready;
				head.active = !empty;
				seat.getComponent(cc.Button).interactable = empty;
				if (empty)
					continue;

				name.getComponent(cc.Label).string = p.name;
				head.getComponent('ImageLoader').setUserID(p.id);

				if (uid == p.id) {
					found = true;
					this.roomid = room.id;
					btn_prepare.active = !p.ready;
					btn_leave.active = true;
				}
			}

			if (!found) {
				btn_prepare.active = false;
				btn_leave.active = false;
			}

			progress.string = room.num_of_turns + ' / ' + room.base_info.maxGames;

			item.room = room;
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

