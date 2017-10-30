
cc.Class({
    extends: cc.Component,

    properties: {
        mjid: -1,
        
        _direction: null,
        _location: null,

		_focusDt: 0,
		_focusID: 0,
    },

    onLoad: function() {
        this.initView();
    },

    initView: function() {
        var name = this.node.name;
        var strs = new Array();
		var dir = null;

        strs = name.split("_");
        if (strs.length >= 2) {
            dir = strs[0];
        }

		var dirs = [ 'south', 'east', 'north', 'west' ];
		if (dirs.indexOf(dir) != -1) {
			this._direction = dir;
			this._location = name.substring(dir.length + 1);
		}

        this.refresh();
    },
    
    refresh: function() {
        this.setBoard();
        this.setTile();
    },
    
    setBoard: function() {
        return;
        var dir = this._direction;
        var loc = this._location;
        
        if (!dir || !loc) {
            return;
        }
        
        var mgr = cc.vv.mahjongmgr;

        var board = this.node.getComponent(cc.Sprite);

        var boardSpriteFrame = mgr.getBoardSpriteFrame(dir, loc);
        if (board && boardSpriteFrame) {
            board.spriteFrame = boardSpriteFrame;
        }
    },
    
    setTile: function() {
        let mjid = this.mjid;
        let tile = this.node.getChildByName("tile");
        if (!tile)
            return;

        let sprite = tile.getComponent(cc.Sprite);
        if (!sprite || mjid < 0) {
			tile.active = false;
            return;
        }

		tile.active = true;

        let mgr = cc.vv.mahjongmgr;
        let sp = mgr.getTileSprite2D(mjid);
        if (sp)
            sprite.spriteFrame = sp;
    },
    
    setTing: function(status) {
        var ting = this.node.getChildByName("ting");

        if (ting)
            ting.active = status;
    },
    
    setKou: function(status) {
        var kou = this.node.getChildByName("kou");
        if (kou)
            kou.active = status;
    },

	setFocus: function(status) {
		var focus = this.node.getChildByName('focus');
		if (focus) {
			focus.active = status;
			focus.opacity = 0;
		}
    },

	showFocus: function() {
		var focus = this.node.getChildByName('focus');
		if (focus && focus.active)
			focus.opacity = 255;
    },

    setFlag: function(name, status) {
        var flag = this.node.getChildByName(name);
        if (flag)
            flag.active = status;
    },

    setContent: function(name, content) {
        var item = this.node.getChildByName(name);
        if (item)
            item.getComponent(cc.Label).string = content;
    },

    setInteractable: function(status) {
        var mask = this.node.getChildByName("mask");
        if (mask)
            mask.active = !status;
    },

    setMJID: function(mjid) {
        this.mjid = mjid;
        this.setTile();
    },
});

