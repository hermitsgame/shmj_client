
cc.Class({
    extends: cc.Component,

    properties: {
        _inputs: [],
        _roomid: [],
        _inputIndex: 0,
    },

    onLoad: function() {
  		var node = this.node;
		var inputs = node.getChildByName('inputs');
		var panel = node.getChildByName('panel');

		for (var i = 0; i < inputs.childrenCount; i++) {
			var input = inputs.children[i];
			var tile = input.getChildByName('tile').getComponent(cc.Label);

			this._inputs.push(tile);
		}

		var btnClose = cc.find('top/btn_back', this.node);
		cc.vv.utils.addClickEvent(btnClose, this.node, 'QuickJoin', 'onBtnClose');
    },

	onEnable:function() {
		this.onResetClicked();
    },

	onInputFinished: function(roomId) {
		var self = this;
	
        cc.vv.userMgr.enterRoom(roomId, function(ret) {
            if (ret.errcode == 0) {
                self.node.active = false;
            }
            else {
                var content = "房间["+ roomId +"]不存在，请重新输入!";
                if(ret.errcode == 4){
                    content = "房间["+ roomId + "]已满!";
                }
                cc.vv.alert.show(content);
                self.onResetClicked();
            }
        });
    },

	onInput: function(num) {
        cc.vv.audioMgr.playButtonClicked();

        var id = this._inputIndex;
        if (id >= this._inputs.length) {
            return;
        }

        this._inputs[id].string = num;
        this._inputIndex = id + 1;
        this._roomid.push(num);

        if (this._inputIndex == this._inputs.length) {
            var roomId = this.parseRoomID();
            this.onInputFinished(roomId);
        }
    },

	onN0Clicked: function() {
        this.onInput(0);
    },
    onN1Clicked:function(){
        this.onInput(1);  
    },
    onN2Clicked:function(){
        this.onInput(2);
    },
    onN3Clicked:function(){
        this.onInput(3);
    },
    onN4Clicked:function(){
        this.onInput(4);
    },
    onN5Clicked:function(){
        this.onInput(5);
    },
    onN6Clicked:function(){
        this.onInput(6);
    },
    onN7Clicked:function(){
        this.onInput(7);
    },
    onN8Clicked:function(){
        this.onInput(8);
    },
    onN9Clicked:function(){
        this.onInput(9);
    },

	onBtnClose:function() {
        cc.vv.audioMgr.playButtonClicked();
		this.node.active = false;
    },

	onResetClicked: function() {
        cc.vv.audioMgr.playButtonClicked();

        for (var i = 0; i < this._inputs.length; ++i) {
            this._inputs[i].string = '';
        }
        this._inputIndex = 0;
        this._roomid = [];
    },

    onDelClicked: function() {
        cc.vv.audioMgr.playButtonClicked();

        if (this._inputIndex > 0) {
            this._inputIndex -= 1;
            this._inputs[this._inputIndex].string = '';
            this._roomid.pop();
        }
    },
    
    parseRoomID: function() {
        var str = "";
        for (var i = 0; i < this._inputs.length; ++i) {
            str += this._roomid[i];
        }
        return str;
    }
});

