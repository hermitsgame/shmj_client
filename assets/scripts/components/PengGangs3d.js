
cc.Class({
    extends: cc.Component,

    properties: {
        _templates: [],
        _tempMJ: [],
        
        _paths: null
    },

    onLoad: function () {
        if (!cc.vv)
            return;

        this._paths = [
            'game/south/layout/penggangs',
            'viewroot/right_peng',
            'game/north/layout/penggangs',
            'viewroot/left_peng'
        ];

        let gameChild = this.node.getChildByName('game');

        let sides = [
            'south', 'east', 'north', 'west'
        ];

        for (let i = 0; i < sides.length; i++) {
            let side = gameChild.getChildByName(sides[i]);
            let pg = side.getChildByName('peng');
            let mahjongs = pg.getChildByName('mahjongs');
            let mj = mahjongs.getChildByName('peng');

            mahjongs.removeChild(mj);
            this._tempMJ.push(mj);

            pg.active = false;
        }
        
        var self = this;

        this.node.on('peng_notify',function(data) {
            var data = data.detail;

            self.onPengGangChanged(data.seatData);
            self.playPengAnimation(data);
        });

        this.node.on('chi_notify',function(data) {
            var data = data.detail;

            self.onPengGangChanged(data.seatData);
            self.playChiAnimation(data);
        });

        this.node.on('gang_notify', function(info) {
            var data = info.detail;

            self.onPengGangChanged(data.seatData);
            self.playGangAnimation(data);
        });
        
        this.node.on('game_begin', function(data) {
            self.onGameBein();
        });

        this.node.on('game_sync', function(data) {
            if (!cc.vv.gameNetMgr.isPlaying())
                return;
			
            self.onGameBein();
            var seats = cc.vv.gameNetMgr.seats;

            for (var i in seats) {
                self.onPengGangChanged(seats[i]);
            }
        });

        this.node.on('refresh_mj', function(data) {
            self.refresh();
        });

        this.refresh();
    },

    start: function() {
        var self = this;

        this._paths.forEach(x=>{
            let peng = cc.find(x, self.node);
            
            console.log('hide ' + x);
            peng.children.forEach(y=>{
                y.active = false;
            });
        });
    },

    refresh: function() {
        let seats = cc.vv.gameNetMgr.seats;
        var self = this;
        seats.forEach(x=>{
            self.onPengGangChanged(x);
        });
    },

    onGameBein: function() {
        this.hideSide('south');
        this.hideSide('east');
        this.hideSide('north');
        this.hideSide('west');
    },

    playPengAnimation: function(data) {
        var seatData = data.seatData;
        var pai = data.pai;
        var net = cc.vv.gameNetMgr;
        var localIndex = net.getLocalIndex(seatData.seatindex);
        var side = net.getSide(localIndex);
        var gameChild = this.node.getChildByName('game');
        var myself = gameChild.getChildByName(side);
        var pg = myself.getChildByName('peng');
        var bg = pg.getChildByName('bg');
        var mahjongs = pg.getChildByName('mahjongs');
        var temp = this._tempMJ[localIndex];

        var oldPos = [ -120, 0, 120 ];
        var newPos = [ -68, 0, 68 ];

        mahjongs.removeAllChildren();
        pg.active = true;

        for (var i = 0; i < 3; i++) {
            var node = cc.instantiate(temp);
            var mj = node.getComponent('SmartMJ');

            mahjongs.addChild(node);

            mj.setFunction(0);
            mj.setMJID(pai);
            node.x = oldPos[i];

            if (oldPos[i] == newPos[i]) {
                continue;
            }

            var action = cc.moveTo(0.2, cc.p(newPos[i], 0));
            node.runAction(action);
        }

        bg.opacity = 0;
        bg.scaleX = 1.2;
        bg.active = true;

        var fnFinished = cc.callFunc(function(target, data) {
            data.active = false;
        }, this, pg);

        var act = cc.sequence(cc.hide(),
                              cc.delayTime(0.2),
                              cc.show(),
                              cc.fadeTo(0.3, 255),
                              cc.delayTime(0.4),
                              fnFinished);

        bg.runAction(act);
    },

    playChiAnimation: function(data) {
        var seatData = data.seatData;
        var pai = data.pai;
        var net = cc.vv.gameNetMgr;
        var localIndex = net.getLocalIndex(seatData.seatindex);
        var side = net.getSide(localIndex);
        var gameChild = this.node.getChildByName('game');
        var myself = gameChild.getChildByName(side);
        var pg = myself.getChildByName('peng');
        var bg = pg.getChildByName('bg');
        var mahjongs = pg.getChildByName('mahjongs');
        var temp = this._tempMJ[localIndex];

        var oldPos = [ -120, 0, 120 ];
        var newPos = [ -68, 0, 68 ];

        mahjongs.removeAllChildren();
        pg.active = true;

        var mjs = net.getChiArr(pai);

        for (var i = 0; i < 3; i++) {
            var node = cc.instantiate(temp);
            var mj = node.getComponent('SmartMJ');

            mahjongs.addChild(node);

            mj.setFunction(0);
            mj.setMJID(mjs[i]);
            node.x = oldPos[i];

            if (oldPos[i] == newPos[i]) {
                continue;
            }

            var action = cc.moveTo(0.2, cc.p(newPos[i], 0));
            node.runAction(action);
        }

        bg.opacity = 0;
        bg.scaleX = 1.2;
        bg.active = true;

        var fnFinished = cc.callFunc(function(target, data) {
            data.active = false;
        }, this, pg);

        var act = cc.sequence(cc.hide(),
                              cc.delayTime(0.2),
                              cc.show(),
                              cc.fadeTo(0.3, 255),
                              cc.delayTime(0.4),
                              fnFinished);

        bg.runAction(act);
    },

    playGangAnimation: function(data) {
        var seatData = data.seatData;
        var pai = data.pai;
        var gangtype = data.gangtype;
        var net = cc.vv.gameNetMgr;
        var localIndex = net.getLocalIndex(seatData.seatindex);
        var side = net.getSide(localIndex);
        var gameChild = this.node.getChildByName('game');
        var myself = gameChild.getChildByName(side);
        var pg = myself.getChildByName('peng');
        var bg = pg.getChildByName('bg');
        var mahjongs = pg.getChildByName('mahjongs');
        var temp = this._tempMJ[localIndex];

        var oldPos = [ -190, -70, 70, 190 ];
        var newPos = [ -102, -34, 34, 102 ];

        mahjongs.removeAllChildren();
        pg.active = true;

        for (var i = 0; i < 4; i++) {
            var node = cc.instantiate(temp);
            var mj = node.getComponent('SmartMJ');

            mahjongs.addChild(node);

            if (gangtype == 'angang' && localIndex != 0) {
                mj.setFunction(1);
            } else {
                mj.setFunction(0);
                mj.setMJID(pai);
            }

            node.x = oldPos[i];

            if (oldPos[i] == newPos[i]) {
                continue;
            }

            var action = cc.moveTo(0.2, cc.p(newPos[i], 0));
            node.runAction(action);
        }

        bg.opacity = 0;
        bg.scaleX = 1.6;
        bg.active = true;

        var fnFinished = cc.callFunc(function(target, data) {
            data.active = false;
        }, this, pg);

        var act = cc.sequence(cc.hide(),
                              cc.delayTime(0.2),
                              cc.show(),
                              cc.fadeTo(0.3, 255),
                              cc.delayTime(0.4),
                              fnFinished);

        bg.runAction(act);
    },

    getPengGangItem: function(root, side, index) {
        let node = root.children[index];
        node.active = true;
        return node;
    },

    hideSide: function(side) {
        let sides = [ 'south', 'east', 'north', 'west' ];
        
        let id = sides.indexOf(side);
        let root = cc.find(this._paths[id], this.node);

        root.children.forEach(x=>{
            x.active = false;
        });

        if (side == "south" || side == 'north') {
            root.width = 0;
        }
    },
    
    onPengGangChanged:function(seatData) {
        if (seatData.angangs == null &&
            seatData.diangangs == null &&
            seatData.wangangs == null &&
            seatData.pengs == null &&
            seatData.chis == null)
        {
            return;
        }

        let net = cc.vv.gameNetMgr;
        let localIndex = net.getLocalIndex(seatData.seatindex);
        let side = net.getSide(localIndex);

        let root = cc.find(this._paths[localIndex], this.node);

        root.children.forEach(x=>{
            x.active = false;
        });

        var self = this;
        let index = 0;

        let pgs = [
            { name: 'angang', data: seatData.angangs },
            { name: 'diangang', data: seatData.diangangs },
            { name: 'wangang', data: seatData.wangangs },
            { name: 'peng', data: seatData.pengs }
        ];
        
        pgs.forEach(x=>{
            x.data.forEach(y=>{
                self.initPengAndGangs(root, side, index, y, x.name);
                index++;
            });
        });

        seatData.chis.forEach(x=>{
            self.initChis(root, side, index, x);
            index++;
        });
    },

    initPengAndGangs: function(pengangroot, side, index, mjid, flag) {
        var pgroot = null;
        var mgr = cc.vv.mahjongmgr;
        let nodes = [];

        console.log('index=' + index);

        if (side == 'south' || side == 'north') {
            pgroot = this.getPengGangItem(pengangroot, side, index);
            pgroot.children.forEach(x=>{
                nodes.push(x);
            });
        } else {
            let peng = pengangroot.getComponent('TestPeng');

            nodes = peng.getStack(index);
        }
        
        nodes.forEach(x=>{
            x.active = true;
        });

        var seatindex = parseInt(mjid / 100);

        mjid = mjid % 100;
        
        let sprite = mgr.getTileSprite3D(mjid);

        console.log('nodes');
        console.log(nodes);

        for (let i = 0; i < nodes.length; i++) {
            var child = nodes[i];
            //var board = child.getComponent(cc.Sprite);
            var tile = child.getChildByName('text');
            var tileSprite = tile.getComponent(cc.Sprite);
            var chi = child.getChildByName('chi');
            var arrow = child.getChildByName('arrow');
            var isGang = flag != "peng";

            if (chi)
                chi.active = false;

            if (child.name == "gang") {
                child.active = isGang;
                
                if (!isGang)
                    continue;

                //board.spriteFrame = mgr.getBoardSpriteFrame(side, "meld");

                tile.active = true;
                tileSprite.spriteFrame = sprite;
            } else {
            	if (flag == "angang") {
                    //board.spriteFrame = mgr.getBoardSpriteFrame(side, "meld_cover");
                    tile.active = false;
                } else {
                    //board.spriteFrame = mgr.getBoardSpriteFrame(side, "meld");

                    tile.active = true;
                    tileSprite.spriteFrame = sprite;

                    if (arrow) {
                        arrow.active = !isGang;
                        if (!isGang)
                            this.setArrow(arrow, seatindex);
                    }
                }
            }
        }
    },

    setArrow: function(arrow, seatindex) {
        var net = cc.vv.gameNetMgr;
        var local = net.getLocalIndex(seatindex);
        var angels = [ 90, 0, -90, 180 ];

        arrow.rotation = angels[local];
    },

	initChis:function(pengangroot, side, index, mjid) {
        var pgroot = null;
        var mgr = cc.vv.mahjongmgr;
        let nodes = [];

        if (side == 'south' || side == 'north') {
            pgroot = this.getPengGangItem(pengangroot, side, index);
            pgroot.children.forEach(x=>{
                nodes.push(x);
            });
        } else {
            let peng = pengangroot.getComponent('TestPeng');

            nodes = peng.getStack(index);
        }

        nodes.forEach(x=>{
            x.active = true;
        });
        
        nodes[3].active = false;

        var mjs = cc.vv.gameNetMgr.getChiArr(mjid);

        for (var i = 0; i < 3; i++) {
            var child = nodes[i];

            //var board = child.getComponent(cc.Sprite);
            var tile = child.getChildByName('text');
            var tileSprite = tile.getComponent(cc.Sprite);
            var chi = child.getChildByName('chi');
            var arrow = child.getChildByName('arrow');

            //board.spriteFrame = mgr.getBoardSpriteFrame(side, "meld");
            tile.active = true;
            tileSprite.spriteFrame = mgr.getTileSprite3D(mjs[i]);

            if (chi)
                chi.active = mjs[i] == (mjid % 100);

            if (arrow)
                arrow.active = false;
        }
    },
});

