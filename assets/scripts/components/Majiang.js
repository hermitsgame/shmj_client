
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
        let name = this.node.name;
        let strs = new Array();
        let dir = null;

        strs = name.split("_");
        if (strs.length >= 2)
            dir = strs[0];

        let dirs = [ 'south', 'east', 'north', 'west' ];
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
        let dir = this._direction;
        let loc = this._location;
        
        if (!dir || !loc)
            return;
        
        let mgr = cc.vv.mahjongmgr;

        let board = this.node.getComponent(cc.Sprite);

        let boardSpriteFrame = mgr.getBoardSpriteFrame(dir, loc);
        if (board && boardSpriteFrame)
            board.spriteFrame = boardSpriteFrame;
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
        let ting = this.node.getChildByName("ting");

        if (ting)
            ting.active = status;
    },
    
    setKou: function(status) {
        let kou = this.node.getChildByName("kou");
        if (kou)
            kou.active = status;
    },

    setFocus: function(status) {
        let focus = this.node.getChildByName('focus');
        if (focus) {
            focus.active = status;
            focus.opacity = 0;
        }
    },

    showFocus: function() {
        let focus = this.node.getChildByName('focus');
        if (focus && focus.active)
            focus.opacity = 255;
    },

    setFlag: function(name, status) {
        let flag = this.node.getChildByName(name);
        if (flag)
            flag.active = status;
    },

    setContent: function(name, content) {
        let item = this.node.getChildByName(name);
        if (item)
            item.getComponent(cc.Label).string = content;
    },

    setInteractable: function(status) {
        let mask = this.node.getChildByName("mask");
        if (mask)
            mask.active = !status;
    },

    setMJID: function(mjid) {
        this.mjid = mjid;
        this.setTile();
    },
});

