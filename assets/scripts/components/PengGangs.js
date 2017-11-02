
cc.Class({
    extends: cc.Component,

    properties: {
        _templates: [],
        _tempMJ: [],
    },

    onLoad: function () {
        if(!cc.vv){
            return;
        }

        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("south");
        var pengangroot = cc.find("layout/penggangs", myself);
        var realwidth = cc.director.getVisibleSize().width;
        var scale = realwidth / 1280;
        
        var sides = [ "south", "east", 'north', "west" ];
        for (var i = 0; i < sides.length; i++) {
            var side = gameChild.getChildByName(sides[i]);
            var peng = cc.find("layout/penggangs", side);
            var child = peng.children[0];

            this._templates.push(child);
            peng.removeChild(child);

            var pg = side.getChildByName('peng');
            var mahjongs = pg.getChildByName('mahjongs');
            var mj = mahjongs.getChildByName('peng');

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

    refresh: function() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },

    onGameBein:function(){
        this.hideSide("south");
        this.hideSide("east");
        this.hideSide("north");
        this.hideSide("west");
    },

    playPengAnimation: function(data) {
        let sd = data.seatData;
        let pai = data.pai % 100;
        let net = cc.vv.gameNetMgr;
        let localIndex = net.getLocalIndex(sd.seatindex);
        let side = net.getSide(localIndex);
        let gameChild = this.node.getChildByName('game');
        let myself = gameChild.getChildByName(side);
        let pg = myself.getChildByName('peng');
        let bg = pg.getChildByName('bg');
        let mahjongs = pg.getChildByName('mahjongs');
        let temp = this._tempMJ[localIndex];

        let oldPos = [ -120, 0, 120 ];
        let newPos = [ -68, 0, 68 ];

        mahjongs.removeAllChildren();
        pg.active = true;

        for (let i = 0; i < 3; i++) {
            let node = cc.instantiate(temp);
            let mj = node.getComponent('SmartMJ');

            mahjongs.addChild(node);

            mj.setFunction(0);
            mj.setMJID(pai);
            node.x = oldPos[i];

            if (oldPos[i] == newPos[i])
                continue;

            let action = cc.moveTo(0.2, cc.p(newPos[i], 0));
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
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.gameNetMgr.getSide(localIndex);
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

        var mjs = cc.vv.gameNetMgr.getChiArr(pai);

        console.log('chi pai=' + pai);
        console.log(mjs);

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
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.gameNetMgr.getSide(localIndex);
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

    getPengGangItem:function(root, side, index) {
        if (root.childrenCount > index) {
            return root.children[index];
        }

        var sides = [ "south", "east", 'north', "west" ];
        var id = sides.indexOf(side);

        var node = cc.instantiate(this._templates[id]);
        root.addChild(node);
        return node;
    },
    
    hideSide: function(side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = cc.find("layout/penggangs", myself);

        if (pengangroot) {
            pengangroot.removeAllChildren();
        }
        
        if (side == "south" || side == 'north') {
            pengangroot.width = 0;
        } else {
            pengangroot.height = 0;
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

        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.gameNetMgr.getSide(localIndex);

        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = cc.find("layout/penggangs", myself);

        for (var i = 0; i < pengangroot.childrenCount; i++) {
            pengangroot.children[i].active = false;
        }

        var index = 0;
        
        var angangs = seatData.angangs;
        for (var i = 0; i < angangs.length; i++) {
            var mjid = angangs[i];
            this.initPengAndGangs(pengangroot, side, index, mjid, "angang");
            index++;
        }

        var diangangs = seatData.diangangs;
        for (var i = 0; i < diangangs.length; i++) {
            var mjid = diangangs[i];
            this.initPengAndGangs(pengangroot, side, index, mjid, "diangang");
            index++;
        }

        var wangangs = seatData.wangangs;
        for (var i = 0; i < wangangs.length; i++) {
            var mjid = wangangs[i];
            this.initPengAndGangs(pengangroot, side, index, mjid, "wangang");
            index++;
        }

        var pengs = seatData.pengs;
        if (pengs) {
            for (var i = 0; i < pengs.length; i++) {
                var mjid = pengs[i];
                this.initPengAndGangs(pengangroot, side, index, mjid, "peng");
                index++;
            }
        }

        var chis = seatData.chis;
        if (chis) {
            for (var i = 0; i < chis.length; i++) {
                var mjid = chis[i];
                this.initChis(pengangroot, side, index, mjid);
                index++;
            }
        }
    },

    initPengAndGangs:function(pengangroot, side, index, mjid, flag) {
        var pgroot = null;
        var mgr = cc.vv.mahjongmgr;

        pgroot = this.getPengGangItem(pengangroot, side, index);
        pgroot.active = true;

        var seatindex = parseInt(mjid / 100);

        mjid = mjid % 100;

        for (var i = 0; i < pgroot.childrenCount; i++) {
            var child = pgroot.children[i];
            var board = child.getComponent(cc.Sprite);
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

                let sprite = mgr.getTileSprite2D(mjid);

                tile.active = true;
                tileSprite.spriteFrame = sprite;
            } else {
            	if (flag == "angang") {
                    board.spriteFrame = mgr.getBoardSprite2D(side, 'meld_cover');
                    tile.active = false;
                } else {
                    board.spriteFrame = mgr.getBoardSprite2D(side, 'meld');

                    let sprite = mgr.getTileSprite2D(mjid);

                    tile.active = true;
                    tileSprite.spriteFrame = sprite;

                    if (arrow) {
                        arrow.active = !isGang;
                        if (!isGang)
                            this.setArrow(side, arrow, seatindex);
                    }
                }
            }
        }
    },

    setArrow: function(side, arrow, seatindex) {
        let net = cc.vv.gameNetMgr;
        let local = net.getLocalIndex(seatindex);
        let spriteMgr = arrow.getComponent('SpriteMgr');
        let sides = [ 'south', 'east', 'north', 'west' ];
        let myself = sides.indexOf(side);

        let idx = (4 + local - myself) % 4 - 1;

        spriteMgr.setIndex(idx);
    },

	initChis:function(pengangroot, side, index, mjid) {
        let pgroot = null;
        let mgr = cc.vv.mahjongmgr;
        let net = cc.vv.gameNetMgr;

        pgroot = this.getPengGangItem(pengangroot, side, index);
        pgroot.active = true;
        pgroot.children[3].active = false;

        let mjs = net.getChiArr(mjid);

        for (let i = 0; i < 3; i++) {
            let child = pgroot.children[i];
            let board = child.getComponent(cc.Sprite);
            let tile = child.getChildByName('text');
            let tileSprite = tile.getComponent(cc.Sprite);
            let chi = child.getChildByName('chi');
            let arrow = child.getChildByName('arrow');

            board.spriteFrame = mgr.getBoardSprite2D(side, "meld");
            tile.active = true;
            tileSprite.spriteFrame = mgr.getTileSprite2D(mjs[i]);

            if (chi)
                chi.active = mjs[i] == (mjid % 100);

            if (arrow)
                arrow.active = false;
        }
    },
});

