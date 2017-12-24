

cc.Class({
    extends: cc.Component,

    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },

        prepareRoot: {
            default: null,
            type: cc.Node
        },

        _options: null,
        _optionsData: null,

        _selectedMJ: null,
        _chupais: [],
        _mopais: [],

        _mjcount: null,
        _gamecount: null,
        _hupaiTips: [],
        _tingFlags: [],

        _huPrompts:[],
        _huTemplates: [],

        _playEfxs: [],

        _tingOpt: null,

        _tingState: -1,
        _gangState: -1,

        _bgMgr: null,

        _acting: 0,
        _gameover: null,

        _tempHolds: [],
        _tempPrompt: null,

        _tempFlowers: [],

        _chipeng: false,

        _isChuPaiActing : false,
    },

    onLoad: function() {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }

        cc.vv.anysdkMgr.setLandscape();

        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }

        console.log('MJGame onLoad');

        this.gameRoot.active = false;
        this.prepareRoot.active = true;

        this.addComponent("GameOver");
        this.addComponent("PengGangs");
        this.addComponent("MJRoom");
        this.addComponent("TimePointer");
        this.addComponent("GameResult");
        this.addComponent("Chat");
        this.addComponent("Folds");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("Voice");
        //this.addComponent('Dice');
        this.addComponent('wildcard');
        this.addComponent('Maima');

        this.initView();
        this.initEventHandlers();

        this.initWanfaLabel();
        this.onGameBegin();

        cc.vv.audioMgr.playBackGround();
    },

    initView: function() {
    	var net = cc.vv.gameNetMgr;
        var gameChild = this.node.getChildByName("game");

        this._mjcount = cc.find("mj_count/mj_count", gameChild).getComponent(cc.Label);
        this._mjcount.string = net.numOfMJ + '张';
        this._gamecount = cc.find("Canvas/roominfo/game_count").getComponent(cc.Label);
        this._gamecount.string = "第" + net.numOfGames + "局 (" + net.maxNumOfGames + ")";

        var south = gameChild.getChildByName("south");
        var layout = south.getChildByName("layout");

        var realwidth = cc.director.getVisibleSize().width;
        var realheight = cc.director.getVisibleSize().height;

        layout.scaleX *= realwidth/1280;
        layout.scaleY *= realwidth/1280;

        var valid = net.getValidLocalIDs();
        var sides = [ 'south', 'east', 'north', 'west' ];
        for (var i = 0; i < sides.length; ++i) {
            var side = sides[i];

            var sideChild = gameChild.getChildByName(side);
            this._hupaiTips.push(sideChild.getChildByName("hupai"));
            this._tingFlags.push(sideChild.getChildByName('ting'));

            var prompt = sideChild.getChildByName("huPrompt");

            if (prompt != null) {
                var hulist = cc.find("hupais/hulist", prompt);
                var temp = hulist.children[0];
                hulist.removeAllChildren();
                this._huPrompts.push(prompt);
                this._huTemplates.push(temp);
            }

            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._chupais.push(sideChild.getChildByName("chupai"));

            var holds = [];
            var _holds = cc.find("layout/holds", sideChild);

            while (_holds.childrenCount > 0) {
                var mj = _holds.children[0];

                holds.push(mj);
                _holds.removeChild(mj);
            }

            this._tempHolds[i] = holds;

            var flowers = sideChild.getChildByName('flowers');
            var flower = flowers.children[0];
            this._tempFlowers.push(flower);
            flowers.removeAllChildren();
            flowers.active = false;

            sideChild.active = valid.indexOf(i) >= 0;
        }

        var opts = gameChild.getChildByName("options");
        this._options = opts;
        this.hideOptions();
        this.hideChupai();

        var tingOpt = gameChild.getChildByName("tingOpt");
        this._tingOpt = tingOpt;
        this.showTingOpt(false);

        var gangOpt = gameChild.getChildByName("gangOpt");
        this._gangOpt = gangOpt;
        this.showGangOpt(false);

        var bg = cc.find('Canvas/bg');
        var bgMgr = bg.getComponent('SpriteMgr');
        var mgr = cc.vv.mahjongmgr;

        bgMgr.setIndex(mgr.getBGStyle());
        this._bgMgr = bgMgr;
        var prompts = gameChild.getChildByName("prompts");
        this._tempPrompt = prompts.children[0];
        prompts.removeAllChildren();
        prompts.active = false;
    },

    showTingPrompts: function(tings) {
        let sd = cc.vv.gameNetMgr.getSelfData();
        
        if (sd.hastingpai)
            return;

        let ts = tings != null ? tings.map(x=>x.pai) : null;
        this.updateTingpai(0, ts);
        return;
        
        var prompts = cc.find('game/prompts', this.node);

        if (!tings || tings.length == 0) {
            prompts.active = false;
            return;
        }

        var len = tings.length;
        var temp = this._tempPrompt;

        while (prompts.childrenCount > len) {
            var child = prompts.children[len];
            prompts.removeChild(child);
        }

        prompts.active = true;

        for (var i = 0; i < len; i++) {
            var prompt = null;
            if (prompts.childrenCount > i) {
                prompt = prompts.children[i];
            } else {
                prompt = cc.instantiate(temp);
                prompts.addChild(prompt);
            } 

            var ting = tings[i];

            var mj = prompt.getChildByName('south_hand').getComponent('Majiang');
            var info = prompt.getChildByName('info').getComponent(cc.Label);
            var hu = prompt.getChildByName('hu').getComponent(cc.Label);

            mj.setMJID(ting.pai);

            info.string = '剩' + ting.left + '张';
            hu.string = ting.pattern;
        }
    },
  
    hideChupai:function() {	
        this._chupais.forEach(x=>{
            x.active = false;
        });
    },

    addFlower: function(data) {
        let net = cc.vv.gameNetMgr;
        let sd = data.seat;
        let old = data.old;
        let add = data.add;
        let seatindex = sd.seatindex;
        let local = net.getLocalIndex(seatindex);

        // 1. 逐一显示补花动作
        // 1) 摸花
        // 2) 补花动画

        let self = this;

        console.log('addFlower');

        self.hideChupai();

        let showFlower = function(cb) {
            self.showMopai(seatindex, add);

            setTimeout(()=>{
                old.push(add);
                self.hideMopai(seatindex);
                self.showChupai(add);
                console.log('play flower');
                self.playEfx(local, 'flower', ()=>{
                    if (cb) cb();
                });

                self.updateSeatFlowers(sd, old);
            }, 500);
        };

        showFlower();
    },

    updateSeatFlowers: function(seat, flowers) {
        let net = cc.vv.gameNetMgr;
        let gameChild = this.node.getChildByName("game");
        let cards = [ 45, 46, 47, 51, 52, 53, 54, 55, 56, 57, 58 ];
        let self = this;

        let getFlower = function(fls, localidx, id) {
            let temp = self._tempFlowers[localidx];

            if (fls.childrenCount > id)
                return fls.children[id];

            let _fl = cc.instantiate(temp);
            fls.addChild(_fl);

            return _fl;
        };

        let seatindex = net.getSeatIndexByID(seat.userid);
        let local = net.getLocalIndex(seatindex);
        let side = net.getSide(local);
        let _flowers = cc.find(side + '/flowers', gameChild);
        let index = 0;

        console.log('seat ' + i + ' flowers ' + flowers.length);
        _flowers.active = flowers.length > 0;
        if (flowers.length == 0)
            return;

        let fls = {};
        flowers.forEach(x=>{
            if (fls[x] == null)
                fls[x] = 0;

            fls[x] += 1;
        });

        for (let key in fls) {
            let pai = parseInt(key);
            let off = cards.indexOf(pai);
            if (off == -1) {
                console.log('card not found ' + pai);
                continue;
            }

            let item = getFlower(_flowers, local, index);
            let tile = item.getChildByName('tile').getComponent('SpriteMgr');
            let num = item.getChildByName('num').getComponent('SpriteMgr');

            console.log('set tile off: ' + off);
            tile.setIndex(off);
            num.setIndex(fls[key] - 1);

            index++;
        }

        while (_flowers.childrenCount > index) {
            let child = _flowers.children[index];
            _flowers.removeChild(child);
        }

        let number = cc.find(side + '/flower/num', gameChild).getComponent(cc.Label);
        number.string = seat.flowers.length;
    },

    updateFlowers: function() {
        let net = cc.vv.gameNetMgr;
        let seats = net.seats;
        let self = this;

        seats.forEach(x=>{
            self.updateSeatFlowers(x, x.flowers);
        });
    },

    showTingOpt: function(enable) {
        this._tingOpt.active = enable;
    },

    showGangOpt: function(enable) {
        this._gangOpt.active = enable;
    },

    initEventHandlers: function() {
        let node = this.node;
        let self = this;
        let net = cc.vv.gameNetMgr;

        net.dataEventHandler = node;		

        node.on('game_holds', data=>{
           self.initMahjongs();
        });

        node.on('game_holds_update', data=>{
            self.updateHolds();
        });

        node.on('game_holds_len', data=>{
            self.updateOtherHolds(data.detail);
        });

        node.on('game_holds_updated', data=>{
            self.holdsUpdated();
        });

        node.on('game_begin', data=>{
            cc.vv.audioMgr.playSFX('Sound/GAME_START0.mp3');
            self.onGameBegin();
        });

        node.on('game_sync', data=>{
            console.log('game sync');
            if (net.isPlaying())
                self.onGameSync();
        });

        node.on('game_chupai', data=>{
            self.hideChupai();
        });

        node.on('game_mopai', data=>{
            let detail = data.detail;
            self.hideChupai();
            self.showMopai(detail.seatIndex, detail.pai);

            let localIndex = net.getLocalIndex(detail.seatIndex);
            if (0 == localIndex) {
                self.checkChuPai(true);
            }
        });

        node.on('game_action', data=>{
            self.showAction(data.detail);
        });

        node.on('user_hf_updated', data=>{
            console.log('user_hf_updated');

            let detail = data.detail;

            if (detail == null)
                self.updateFlowers();
            else
                self.addFlower(detail);
        });

        node.on('hupai', hdata=>{
            let data = hdata.detail;
            let seatIndex = data.seatindex;
            let localIndex = net.getLocalIndex(seatIndex);
            let iszimo = data.iszimo;
            let action = data.action; // qiangganghu, ganghua, zimo, hu, gangpaohu  ->  qianggang, gangkai, zimo, hu
            let target = data.target;

            if (localIndex == 0)
                self.hideOptions();

            let seatData = net.seats[seatIndex];
            seatData.hued = true;

            if (data.holds) {
                seatData.holds = data.holds;
                seatData.holds.push(data.hupai);
            }

            if (localIndex == 0) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }

            let audio_action = data.iszimo ? 'zimo' : 'hu';
            let efx = 'hu';
            
            if (action == 'qiangganghu')
                efx = 'qianggang';
            else if (action == 'ganghua')
                efx = 'gangkai';
            else if (action == 'gangpaohu')
                efx = 'hu';
            else
                efx = action;
            
            cc.vv.audioMgr.playDialect(audio_action, seatData.userid);
            self.playEfx(localIndex, efx);

            if (target != null) {
                let fp = net.getLocalIndex(target);
                self.playEfx(fp, 'dianpao');
            }
/*
            if (cc.vv.replayMgr.isReplay()) {
                var action = data.iszimo ? 'zimo' : 'hu';

                self.playEfx(localIndex, action);
                cc.vv.audioMgr.playDialect('hu', seatData.userid);
           }
*/
        });

        node.on('mj_count', data=>{
            self._mjcount.string = net.numOfMJ + '张';
        });

        node.on('game_num', data=>{
            self._gamecount.string = "第" + net.numOfGames + "局 (" + net.maxNumOfGames + ")";
        });

        node.on('game_over', data=>{
            let odata = data.detail;
            let info = odata.info;
            let maima = self.node.getComponent('Maima');
            
            if (info.maima) {
                maima.showResult(info.maima, ()=>{
                    self.doGameOver(odata);
                });
            } else {
                setTimeout(()=>{
                    self.doGameOver(odata);
                }, 3000);
            }
        });

        node.on('game_chupai_notify', data=>{
            self.hideChupai();
            let seatData = data.detail.seatData;
            let pai = data.detail.pai;

            self._isChuPaiActing = true;

            let cbDone = function() {
                self._isChuPaiActing = false;
            };
            if (seatData.seatindex == net.seatIndex) {
                self.doChupai(seatData, pai, cbDone);
                self.checkChuPai(false);
                self.showTingPrompts();
            } else {
                self.doChupai(seatData, pai, cbDone);
            }

            self.showChupai();
            var content = cc.vv.mahjongmgr.getAudioContentByMJID(pai);
            cc.vv.audioMgr.playDialect(content, seatData.userid);
        });

        node.on('guo_notify', data=>{
            self.hideChupai();
            self.hideOptions();
            var seatData = data.detail;
        });

        node.on('guo_result', data=>{
            self.hideOptions();
        });

        node.on('peng_notify', data=>{
            self.hideChupai();

            var seatData = data.detail.seatData;
            self._chipeng = true;
            if (seatData.seatindex == net.seatIndex) {
                self.initMahjongs();
                self.checkChuPai(true);
            } else {
                self.initOtherMahjongs(seatData, '', true);
            }

            self._chipeng = false;
            var localIndex = self.getLocalIndex(seatData.seatindex);

            self.playEfx(localIndex, 'peng');
            cc.vv.audioMgr.playDialect('peng', seatData.userid);

            self.hideOptions();
        });

        node.on('ting_notify', data=>{
            let seatData = data.detail;
            let localIndex = self.getLocalIndex(seatData.seatindex);
            let ting = self._tingFlags[localIndex];

            ting.active = true;
            if (seatData.seatindex == net.seatIndex) {
                //self.initMahjongs();
                self.updateTingpai(localIndex, seatData.tings);
                self.checkChuPai(true);
            } else {
                self.initOtherMahjongs(seatData);
            }

            self.playEfx(localIndex, 'ting');
            //cc.vv.audioMgr.playAction('ming');
        });

        node.on('chi_notify', data=>{
            self.hideChupai();

            var seatData = data.detail.seatData;
            var pai = data.detail.pai;
            self._chipeng = true;
            if (seatData.seatindex == net.seatIndex) {
                self.initMahjongs();
                self.checkChuPai(true);
            } else {
                self.initOtherMahjongs(seatData, '', true);

                var sd = net.getSelfData();

                if (sd.hastingpai) {
                    var mjs = net.getChiArr(pai);
                    var found = false;

                    for (var i = 0; i < mjs.length; i++) {
                        if (sd.tings.indexOf(mjs[i]) >= 0) {
                            found = true;
                            break;
                        }
                    }

                    if (found)
                        self.updateTingpai(0, sd.tings);
                }
            }

            self._chipeng = false;

            var localIndex = self.getLocalIndex(seatData.seatindex);

            self.playEfx(localIndex, 'chi');
            cc.vv.audioMgr.playDialect('chi', seatData.userid);

            self.hideOptions();
        });

        node.on('gang_notify', info=>{
            self.hideChupai();
            var data = info.detail;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            if (seatData.seatindex == net.seatIndex) {
                self.initMahjongs();
                self.checkChuPai(false);
                self.showTings(false);
            } else {
                self.initOtherMahjongs(seatData);

                var pai = data.pai;
                var sd = net.getSelfData();

                if (sd.hastingpai && sd.tings.indexOf(pai) >= 0)
                    self.updateTingpai(0, sd.tings);
            }

            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, 'gang');
            cc.vv.audioMgr.playDialect('gang', seatData.userid);
        });

        node.on("hangang_notify", data=>{
            var data = data.detail;
            var localIndex = self.getLocalIndex(data);
            self.hideOptions();
        });

        node.on('refresh_mj', ()=>{
            self.refreshMJ();
        });

        node.on('refresh_bg', data=>{
            self._bgMgr.setIndex(data.detail);
        });

        var fnTouchStart = function(event) {
            var target = event.target;
            var mj = target.getComponent('SmartMJ');

            if (mj && !mj.getInteractable())
                return;

            target.moved = false;
            self.southMJClicked(event);
        };

        var fnTouchEnd = function(event) {
            var selected = self._selectedMJ;
            var target = event.target;
            var mj = target.getComponent('SmartMJ');

            if (mj && !mj.getInteractable())
                return;

            if (selected && selected == target) {
                var touches = event.getTouches();
                var position = target.parent.convertTouchToNodeSpaceAR(touches[0]);
                var s = target.getContentSize();
                var rect = cc.rect(target.oldx - s.width / 2, target.oldy - s.height / 2, s.width, s.height);

                if (cc.rectContainsPoint(rect, position)) {
                    if (target.moved) {
                        target.x = target.oldx;
                        target.y = target.oldy;
                        self._selectedMJ = null;
                        self.showTingPrompts();
                    } else {
                        target.x = target.oldx;
                        target.y = target.oldy + 15;
                    }
                } else {
                    self.shoot(target);
                    self._selectedMJ = null;
                    self.showTingPrompts();
                }
            }
        };

        var fnTouchMove = function(event) {
            var selected = self._selectedMJ;
            var target = event.getCurrentTarget();
            var mj = target.getComponent('SmartMJ');

            if (mj && !mj.getInteractable())
                return;

            if (selected && selected == target) {
                var touches = event.getTouches();
                var position = target.parent.convertTouchToNodeSpaceAR(touches[0]);
                var s = target.getContentSize();
                var rect = cc.rect(target.oldx - s.width / 4, target.oldy - s.height / 4, s.width / 2, s.height / 2);

                target.setPosition(position);

                if (!cc.rectContainsPoint(rect, position)) {
                    target.moved = true;
                }
            }
        };

        var holds = this._tempHolds[0];
        for (var i = 0; i < holds.length; i++) {
            var mjnode = holds[i];

            mjnode.on(cc.Node.EventType.TOUCH_START, fnTouchStart);
            mjnode.on(cc.Node.EventType.TOUCH_END, fnTouchEnd);
            mjnode.on(cc.Node.EventType.TOUCH_MOVE, fnTouchMove);
            mjnode.on(cc.Node.EventType.TOUCH_CANCEL, fnTouchEnd);
        }
    },

    hideAllHolds: function() {
        var sides = [ 'south', 'east', 'north', 'west' ];

        for (var i = 0; i < sides.length; i++) {
            var sideHolds = cc.find('game/' + sides[i] + '/layout/holds', this.node);

            while (sideHolds.childrenCount > 0) {
                var mjnode = sideHolds.children[0];

                this.putMJItem(sideHolds, i, mjnode);
            }

            var flowers = cc.find('game/' + sides[i] + '/flowers', this.node);

            flowers.active = false;
        }
    },

    doGameOver: function(data) {
        this.gameRoot.active = false;
        this.prepareRoot.active = true;

        this.hideAllHolds();

        console.log('doGameOver');

        let gameover = this.node.getComponent('GameOver');
        gameover.onGameOver(data);
    },

    playHuAction: function(data, cb) {
        var results = data;
        var done = 0;
        var self = this;
        var net = cc.vv.gameNetMgr;
        var nSeats = net.numOfSeats;
        var seats = net.seats;

        if (results.length == 0) {
            if (cb) cb();
            return;
        }

        var fnCB = function() {
            console.log('fbCB');
            done += 1;

            if (done == nSeats) {
                if (cb) cb();
            }
        };

        var playActions = function(hu) {
            var index = hu.index;
            var uid = hu.userid;
            var acts = hu.actions;

            if (!acts || acts.length == 0) {
                fnCB();
                return;
            }

            var act = acts.pop();
            var data = hu;

            console.log('playing ' + act + '@' + index);

            if (hu.hued) {
                console.log('xiong playEfx');
                self.playEfx(index, act);
                console.log('xiong audioMgr.playHu');
                cc.vv.audioMgr.playHu(act, uid, function() {
                    setTimeout(function() {
                        console.log('playActions');
                        playActions(data);
                    }, 500);
                });
            } else {
                console.log('xiong playEfx2');
                self.playEfx(index, act, function() {
                    setTimeout(function() {
                        console.log('playActions2');
                        playActions(data);
                    }, 500);
                 });
             }
        };

        for (let i = 0; i < results.length; i++) {
            let localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            let result = results[i];
            let hu = result.hu;
            let actions = [];

            if (!hu) {
                fnCB();
                continue;
            }

            hu.index = localIndex;
            hu.userid = seats[i].userid;

            let act = hu.action;

            if (hu.numDianPao > 1) {
                actions.push('yipaoduoxiang');
            } else if (act == 'fangpao') {
                actions.push('dianpao');
            } else if (act == 'huangzhuang') {
                actions.push('huangzhuang');
            } else if (hu.hued) {
                if (hu.isDuiDuiHu) {
                    actions.push('pengpeng');
            	}

                if (act == 'ganghua') {
                    actions.push('gangkaihua');
                } else if (act == 'qiangganghu') {
                    actions.push('qianggang');
                } else if (act == 'zimo') {
                    actions.push('zimo');
                } else if (act == 'hu') {
                    actions.push('hu');
                }
            }

            hu.actions = actions;
            playActions(hu);
        }
    },

    refreshMJ: function() {
        if (!this.gameRoot.active)
            return;

        this.initMahjongs('refresh');
        var seats = cc.vv.gameNetMgr.seats;
        for (let i in seats) {
            let seatData = seats[i];
            let localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if(localIndex != 0)
                this.initOtherMahjongs(seatData, 'refresh');
        }

        for (let i = 0; i < this._huTemplates.length; i++) {
            let temp = this._huTemplates[i];
            let mj = temp.getComponent('Majiang');
            mj.refresh();
        }

        for (let i = 0; i < this._huPrompts.length; i++) {
            let prompt = this._huPrompts[i];
            let hulist = cc.find("hupais/hulist", prompt);

            for (let j = 0; j < hulist.childrenCount; j++) {
                let pai = hulist.children[j];
                let mj = pai.getComponent('Majiang');
                mj.refresh();
            }
        }

        for (let i = 0; i < this._chupais.length; i++) {
            let chupai = this._chupais[i];
            let mj = chupai.getChildByName('south_meld').getComponent('Majiang');
            mj.refresh();
        }
/*
        let prompts = cc.find('game/prompts', this.node);
        for (let i = 0; i < prompts.childrenCount; i++) {
            let prompt = prompts.children[i];
            let mj = prompt.getChildByName('south_hand').getComponent('Majiang');
            mj.refresh();
        }
*/
        this._tempPrompt.getChildByName('south_hand').getComponent('Majiang').refresh();
    },

    showChupai: function(out) {
        let net = cc.vv.gameNetMgr;
        let pai = out != null ? out : net.chupai;
        if( pai >= 0 ) {
            let localIndex = this.getLocalIndex(net.turn);
            let chupai = this._chupais[localIndex];
            let mj = chupai.getChildByName('south_meld').getComponent('Majiang');

            mj.setMJID(pai);
            chupai.active = true;

            let self = this;

            setTimeout(()=>{
                chupai.active = false;
            }, 1800);
        }
    },

    addOption: function(name) {
        let ops = [ 'gang', 'peng', 'chi', 'hu', 'ting', 'guo' ];

        let id = ops.indexOf(name);
        if (id == -1) {
            console.log("addOption: unknown option name");
            return;
        }

        let op = this._options.children[id];
        op.active = true;
    },

    hideOptions: function(data) {
        let options = this._options;
        options.active = false;
        options.children.forEach(x=>{
            x.active = false;
        });
    },

    hasOptions: function() {
        return this._options.active;
    },

    showAction: function(data) {
        let options = this._options;
        this._optionsData = data;
        let net = cc.vv.net;

        if (options.active)
            this.hideOptions();

        if (!data)
            return;

        if (data.hu || data.gang || data.peng || data.chi || data.ting) {
            options.active = true;

            this.addOption("guo");
            
            if (data.ting) {
                this.addOption("ting");
                this.showTings(true);
            }

            if (data.hu) {
                this.addOption("hu");
            }

            if (data.gang) {
                this.addOption("gang");
            }

            if (data.peng) {
                this.addOption("peng");
            }

            if (data.chi) {
                this.addOption('chi');
            }
        }
    },

    initWanfaLabel:function(){
        let wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },

    updateTingpai: function(localIndex, tings) {
        let huPrompt = this._huPrompts[localIndex];
        
        if (tings == null || tings.length == 0) {
            huPrompt.active = false;
            return;
        }
        
        let huTemplate = this._huTemplates[localIndex];
        let wc = cc.vv.wildcard;

        let hupais = huPrompt.getChildByName('hupais');
        let hulist = hupais.getChildByName('hulist');

        hulist.removeAllChildren();

        for (let i = 0; i < tings.length; i++) {
            let hu = cc.instantiate(huTemplate);
            let mj = hu.getComponent("Majiang");

            mj.setMJID(tings[i]);
            mj.setContent('num', wc.getLeft(tings[i]));
            hulist.addChild(hu);
        }

        hupais.active = tings.length > 0;
        huPrompt.active = true;
    },

    hideTingpai: function(localIndex) {
        var huPrompt = this._huPrompts[localIndex];
        huPrompt.active = false;
    },

    playEfx:function(index, name, cb) {
        var anim = this._playEfxs[index];
        anim.node.active = true;

        var fn = function() {
            if (cb) {
                cb();
                anim.off('finished', fn);
            }
        };

        if (cb) {
            anim.on('finished', fn);
        }

        var state = anim.play(name);
//          if (!state) {
//              fn();
//          }
    },

    onGameSync: function() {
        console.log('onGameSync');
        var net = cc.vv.gameNetMgr;

        this.gameRoot.active = true;
        this.prepareRoot.active = false;

        this._mjcount.string = net.numOfMJ + '张';
        this._gamecount.string = "第" + net.numOfGames + "局 (" + net.maxNumOfGames + ")";

        this.initMahjongs('reset');
        var seats = net.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var show = cc.vv.replayMgr.isReplay();
            var localIndex = net.getLocalIndex(i);
            if (localIndex != 0) {
                this.initOtherMahjongs(seatData);
                if (i == net.turn) {
                    var mopai = show ? seatData.holds[seatData.holds.length - 1] : -1;
                    this.showMopai(i, mopai);
                }
                else {
                    this.showMopai(i, null);
                }
            }
        }

        this.showChupai();
        if(net.curaction != null){
            this.showAction(net.curaction);
            net.curaction = null;
        }

        if (net.seatIndex == net.turn) {
            this.checkChuPai(true);
        }
    },

    onGameBegin: function() {
        var net = cc.vv.gameNetMgr;

        this._acting = 0;
        this._gameover = null;

        console.log('onGameBegin');

        for (var i = 0; i < this._playEfxs.length; ++i) {
            this._playEfxs[i].node.active = false;
        }

        for (var i = 0; i < this._huPrompts.length; ++i) {
            this._huPrompts[i].active = false;
        }

        for (var i = 0; i < net.seats.length; ++i) {
            var seatData = net.seats[i];
            var localIndex = net.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            var ting = this._tingFlags[localIndex];

            ting.active = seatData.hastingpai;
            hupai.active = seatData.hued;
            if (seatData.hued) {
                hupai.getChildByName("sprHu").active = true;
            }

            if (seatData.hastingpai && seatData.tings) {
                this.updateTingpai(localIndex, seatData.tings);
            }
        }

        this.hideChupai();
        this.hideOptions();

        if (net.gamestate == "" && !cc.vv.replayMgr.isReplay()) {
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;

        if (!cc.vv.replayMgr.isReplay()) {
            return;
        }

        this.initMahjongs('reset');
        var seats = net.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var show = cc.vv.replayMgr.isReplay();
            var localIndex = net.getLocalIndex(i);
            if (localIndex != 0) {
                this.initOtherMahjongs(seatData);
                if (i == net.turn) {
                    var mopai = show ? seatData.holds[seatData.holds.length - 1] : -1;
                    this.showMopai(i, mopai);
                }
                else {
                    this.showMopai(i, null);
                }
            }
        }

        this.showChupai();
        if (net.curaction != null) {
            this.showAction(net.curaction);
            net.curaction = null;
        }

        if (net.seatIndex == net.turn) {
            this.checkChuPai(true);
        }
    },

    onMJClicked: function(event) {

    },

    southMJClicked: function(event) {
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }

        let target = event.target;
        let holds = cc.find("game/south/layout/holds", this.node);

        for (let i = 0; i < holds.childrenCount; i++) {
            let mjnode = holds.children[i];
            let mj = mjnode.getComponent('SmartMJ');

            if (target == mjnode) {
                if (this._gangState == 0) {
                    if (this._selectedMJ != null) {
                        this._selectedMJ.y = 0;
                    }

                    this.onMJChoosed(mj);
                    return;
                } else {
                    let old = this._selectedMJ;
                    
                    if (target == old) {
                        this.shoot(target);
                        old.x = old.oldx;
                        old.y = old.oldy;
                        this._selectedMJ = null;
                        this.showTingPrompts();
                        return;
                    }

                    if (old != null) {
                        old.x = old.oldx;
                        old.y = old.oldy;
                    }

                    target.oldx = target.x;
                    target.oldy = target.y;

                    //target.y = 15;
                    this._selectedMJ = target;
                    this.onMJChoosed(mj);
                    return;
                }
            }
        }
    },

    onMJChoosed: function(mj) {
        let mjid = mj.mjid;
        let options = this._optionsData;
        let net = cc.vv.gameNetMgr;
        let wc = cc.vv.wildcard;
        let seats = net.seats;
        let seatData = seats[net.seatIndex];
        let holds = seatData.holds;

        if (this._tingState == 0) {
            let tings = wc.getTings(seatData, mjid);
            this.showTingPrompts(tings);
        } else if (this._gangState == 0) {
            this.enterGangState(1, mjid);
        } else {
            if (options) {
                let tings = wc.getTings(seatData, mjid);
                this.showTingPrompts(tings);
            }
        }
    },

    shoot: function(mjnode) {
        if (mjnode == null)
            return;

        let net = cc.vv.net;
        let mj = mjnode.getComponent('SmartMJ');
        let mjid = mj.mjid;

        this._lastChupai = mjnode;

        if (this._tingState == 0) {
            this.enterTingState(1, mjid);
        } else {
            if (this.hasOptions())
                net.send("guo");

            this.showTings(false);

            net.send('chupai', { pai : mjid });
        }

        this._optionsData = null;
    },

    checkChuPai: function(check) {
        let net = cc.vv.gameNetMgr;
        let seatData = net.getSelfData();
        let hastingpai = seatData.hastingpai;

        let holds = cc.find("game/south/layout/holds", this.node);
        let mjcnt = holds.childrenCount;

        if (cc.vv.replayMgr.isReplay()) {
            for (let i = 0; i < mjcnt; ++i) {
                let mjnode = holds.children[i];
                let mj = mjnode.getComponent('SmartMJ');

                mj.setInteractable(false);
            }

            return;
        }

        if (check) {
            if (hastingpai) {
                for (let i = 0; i < mjcnt; ++i) {
                    let mjnode = holds.children[i];
                    let mj = mjnode.getComponent('SmartMJ');

                    if (mjnode.active)
                        mj.setInteractable((i == mjcnt - 1) && (mjcnt % 3 == 2));
                }
            } else {
                for (let i = 0; i < mjcnt; ++i) {
                    let mjnode = holds.children[i];
                    let mj = mjnode.getComponent('SmartMJ');
                    let mjid = mj.mjid;

                    let can = !(seatData.lastChiPai && seatData.lastChiPai == mjid);

                    mj.setInteractable(can);
                }
	    }
        } else {
            for (let i = 0; i < mjcnt; ++i) {
                let mjnode = holds.children[i];
                let mj = mjnode.getComponent('SmartMJ');

                mj.setInteractable(false);
            }
        }
    },

    checkGangPai: function() {
        let holds = cc.find("game/south/layout/holds", this.node);
        let mjcnt = holds.childrenCount;
        let options = this._optionsData;
        let gp = options.gangpai;

        for (let i = 0; i < mjcnt; i++) {
            let mjnode = holds.children[i];
            let mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active)
                continue;

            let mjid = mj.mjid;
            let gang = (gp.indexOf(mjid) != -1);

            mj.setInteractable(gang);
        }
    },
    
    checkTingPai: function() {
        let holds = cc.find("game/south/layout/holds", this.node);
        let mjcnt = holds.childrenCount;
        let op = this._optionsData;
        let tingouts = op ? op.tingouts : null;
        
        for (let i = 0; i < mjcnt; i++) {
            let mjnode = holds.children[i];
            let mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active)
                continue;

            let mjid = mj.mjid;
            let ting = !tingouts || (tingouts.indexOf(mjid) != -1);

            mj.setInteractable(ting);
        }
    },

    showTings: function(enable) {
        let holds = cc.find("game/south/layout/holds", this.node);
        let mjcnt = holds.childrenCount;
        let op = this._optionsData;
        let tingouts = op ? op.tingouts : null;

        for (let i = 0; i < mjcnt; i++) {
            let mjnode = holds.children[i];
            let mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active)
                continue;

            let ting = enable && tingouts && tingouts.indexOf(mj.mjid) != -1;

            mj.setTing(ting);
        }
    },

    getLocalIndex: function(index) {
        return cc.vv.gameNetMgr.getLocalIndex(index);
    },

    showChiOptions: function(pai, types) {
        var chiOpt = cc.find('game/chiOpt', this.node);
        var chis = chiOpt.getChildByName('chis');
        var index = 0;

        chiOpt.active = true;

        types.sort((a, b)=>{
            return b - a;
        });

        for (var i = 0; i < types.length && i < chis.childrenCount; i++) {
            var chi = chis.children[i];
            var arr = cc.vv.gameNetMgr.getChiArr(types[i] * 100 + pai, true);

            chi.active = true;
            chi.chitype = types[i];
            for (var j = 0; j < arr.length; j++) {
                var mj = chi.children[j].getComponent('Majiang');
                mj.setMJID(arr[j]);
            }

            index++;
        }

        for (var i = index; i < chis.childrenCount; i++) {
            var chi = chis.children[i];
            chi.active = false;
        }
    },

    hideChiOptions: function() {
        var chiOpt = cc.find('game/chiOpt', this.node);
        chiOpt.active = false;
    },

    onChiOptionClicked: function(event) {
        var net = cc.vv.net;

        this.hideChiOptions()

        var type = event.target.chitype;
        var data = this._optionsData;
        var pai = data.pai;

        net.send('chi', { type: type, pai: pai });
    },

    onOptionClicked: function(event, customData) {
        let target = event.target;
        let net = cc.vv.net;
        let data = this._optionsData;
        let ops = [ 'peng', 'gang', 'hu', 'chi', 'ting', 'guo' ];

        let index = ops.indexOf(customData);

        this.showTingPrompts();

        switch (index) {
            case 0:
            {
                net.send("peng");
                break;
            }
            case 1:
            {
                this.enterGangState(0);
                break;
            }
            case 2:
            {
                net.send("hu");
                break;
            }
            case 3:
            {
                let pai = data.pai;
                let types = data.chitypes;

                if (types.length > 1) {
                    this.hideOptions();
                    this.showChiOptions(pai, types);
                } else {
                    net.send('chi', { type: types[0], pai: pai });
                }


                break;
            }
            case 4:
            {
                this.hideOptions();
                this.enterTingState(0);
                break;
            }
            case 5:
            {
                this.hideChiOptions();
                net.send("guo");
                break;
            }
            default:
                break;
        }
    },

    enterGangState: function(state, pai) {
        this._gangState = state;

        let options = this._optionsData;
        let gp = options.gangpai;
        let net = cc.vv.net;

        switch (state) {
            case 0:
                if (gp.length == 1) {
                    this.enterGangState(1, gp[0]);
                } else {
                    this.showGangOpt(true);
                    this.checkGangPai();
                }

                break;
            case 1:
                net.send("gang", { pai : pai });
                this.enterGangState(-1);
                break;
            case -1:
                this.showGangOpt(false);
                this.checkChuPai(false);
                break;
            default:
                break;
        }
    },

    doTing: function(seatData) {
        let localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        let side = cc.vv.mahjongmgr.getSide(localIndex);
        let sideHolds = cc.find('game/' + side + '/layout/holds', this.node);

        for (let i = 0; i < sideHolds.childrenCount; i++) {
            let child = sideHolds.children[i];
            let mj = child.getComponent('SmartMJ');

            mj.setFunction(1);
        }
    },
	
    enterTingState: function(state, pai) {
        this._tingState = state;

        let options = this._optionsData;
        let net = cc.vv.net;
        let mgr = cc.vv.mahjongmgr;
        let seatData = cc.vv.gameNetMgr.getSelfData();
        let holds = seatData.holds;

        console.log("tingState " + state);

        switch (state) {
            case 0:
            {
                this.showTingOpt(true);
                this.checkTingPai();
                break;
            }
            case 1:
            {
                this.showTingOpt(false);
                this.showTingPrompts();
                //this.doTing(seatData);
                net.send("ting", { pai: pai });
                this.enterTingState(-1);
                break;
            }
            case -1: // leave
            {
                this.showTingOpt(false);
                this.showTings(false);
                this.checkChuPai(true);
                this.showTingPrompts();
                break;
            }
            default:
            {
                break;
            }
        }
    },
    
    onTingCancelClicked: function() {
        this.enterTingState(-1);
		this.showTings(true);
        cc.vv.net.send("guo");
    },

    getMJItem: function(root, localIndex, index) {
        if (root.childrenCount > index) {
            return root.children[index];
        }

        var node = this._tempHolds[localIndex].pop();
        var mj = node.getComponent('SmartMJ');

        mj.reset();
        root.addChild(node);

        return node;
    },

    putMJItem: function(root, localIndex, item) {
        root.removeChild(item, false);
        this._tempHolds[localIndex].push(item);
    },

    getMJPosition: function(localIndex, id) {
        let startx = 0;
        let starty = 0;
        let xoff = 0;
        let yoff = 0;

        if (0 == localIndex) {
            startx = 42.5;
            xoff = 85;
        } else if (localIndex == 1) {
            starty = 19;
            yoff = 36.5;
        } else if (localIndex == 2) {
            startx = -21.8;
            xoff = -43.6;
        } else if (localIndex == 3) {
            starty = -13.68;
            yoff = -36.5;
        }

        let x = startx + xoff * id;
        let y = starty + yoff * id;

        return cc.p(x, y);
    },

    setMJLocation: function(mjnode, localIndex, index, board, mopai) {
        let startx = 0;
        let starty = 0;
        let xoff = 0;
        let yoff = 0;
        let barrierx = 0;
        let barriery = 0;
        let id = index;

        if (localIndex == 0) {
            startx = 42.5;
            xoff = 85;

            if (mopai)
                barrierx = 20;
        } else if (localIndex == 1) {
            if (board) {
                starty = 19
                yoff = 36.5;
            } else {
                starty = 19;
                yoff = 38;
            }

            if (mopai)
                barriery = 20;
        } else if (localIndex == 2) {
            startx = -21.8;
            xoff = -43.6;

            if (mopai)
                barrierx = -20;
        } else if (localIndex == 3) {
            if (board) {
                starty = -13.68;
                yoff = -36.5;
            } else {
                starty = -13.68;
                yoff = -38;
            }

            if (mopai)
                barriery = -20;
        }

        let x = startx + xoff * id + barrierx;
        let y = starty + yoff * id + barriery;
        
        mjnode.x = x;
        mjnode.y = y;
    },

    sortHolds: function(seatData) {
        let holds = seatData.holds;
        if (holds == null)
            return null;

        let mopai = null;

        if (!this._chipeng) {
            let l = holds.length;
            if (l % 3 == 2)
                mopai = holds.pop();
        }

        cc.vv.gameNetMgr.sortMJ(holds);

        if (mopai != null)
            holds.push(mopai);

        return holds;
    },

    hideMopai: function(seatindex) {
        let net = cc.vv.gameNetMgr;
        let localIndex = net.getLocalIndex(seatindex);
        let side = net.getSide(localIndex);
        let sideHolds = cc.find('game/' + side + '/layout/holds', this.node);
        let mjcnt = sideHolds.childrenCount;
        let swap = (side == 'east');
        let moid = swap ? 0 : mjcnt - 1;
        let mopaiNode = sideHolds.children[moid];

        if (mopaiNode == undefined) {
            console.log(mjcnt, moid);
            console.log("xiong undefined");
        }

        cc.vv.audioMgr.playSFX('Sound/OUT_CARD0.mp3');

        this.putMJItem(sideHolds, localIndex, mopaiNode);
    },

    doChupai: function(seatData, pai) {
        let net = cc.vv.gameNetMgr;
        let localIndex = net.getLocalIndex(seatData.seatindex);
        let side = net.getSide(localIndex);
        let sideHolds = cc.find('game/' + side + '/layout/holds', this.node);
        let mjcnt = sideHolds.childrenCount;
        let swap = (side == 'east');
        let myself = (0 == localIndex);

        let moid = swap ? 0 : mjcnt - 1;
        let mopaiNode = sideHolds.children[moid];

        if (mopaiNode == undefined) {
            console.log(mjcnt, moid);
            console.log("falls undefined");
        }

        let mopai = mopaiNode.getComponent('SmartMJ');
        let mopaiId = mopai.mjid;
        let folds = this.node.getComponent('Folds');

        let show = (myself || seatData.hued || cc.vv.replayMgr.isReplay());

        cc.vv.audioMgr.playSFX('Sound/OUT_CARD0.mp3');

        if (!show) {
            let pos = mopaiNode.parent.convertToWorldSpaceAR(mopaiNode.position);

            folds.doChupai(seatData, pai, pos);
            this.putMJItem(sideHolds, localIndex, mopaiNode);
            return;
        }

        let mjnode = null;

        if (myself) {
            mjnode = this._lastChupai;
            this._lastChupai = null;
        }

        if (mjnode == null && mopaiId == pai) {
            mjnode = mopaiNode;
        }

        for (let i = 0; i < mjcnt; i++) {
            let node = sideHolds.children[i];
            let mj = node.getComponent('SmartMJ');

            node.oldID = swap ? (mjcnt - 1 - i) : i;

            if (mjnode == null && mj.mjid == pai)
                mjnode = node;
        }

        if (!mjnode)
            console.log('mjnode not found!');

        let pos = sideHolds.convertToWorldSpaceAR(mjnode.position);

        this.putMJItem(sideHolds, localIndex, mjnode);
        folds.doChupai(seatData, pai, pos);

        if (mopaiNode == mjnode)
            return;

        let holds = [];

        mjcnt = sideHolds.childrenCount;

        for (let i = 0; i < mjcnt - 1; i++) {
            let node = sideHolds.children[swap ? (mjcnt - 1 - i) : i];

            holds.push(node);
        }

        let max = 0;
        let _holds = [];

        for (let i = 0; i < holds.length; i++) {
            let mj = holds[i].getComponent('SmartMJ');

            _holds.push(mj.mjid);
        }

        _holds.push(mopaiId);
        net.sortMJ(_holds);

        for (let i = 0; i < _holds.length; i++) {
            let pai = _holds[i];

            if (pai == mopaiId)
                max = i;
        }

        holds.splice(max, 0, mopaiNode);

        for (let i = 0; i < holds.length; i++) {
            let node = holds[i];
            let p0 = this.getMJPosition(localIndex, i);

            node.setSiblingIndex(swap ? (mjcnt - 1 - i): i);

            if (node != mopaiNode) {
                if (i != node.oldID)
                    node.runAction(cc.moveTo(0.3, p0));
            } else {
                let oldx = node.x;
                let oldy = node.y;
                let p1 = null;
                let p2 = null;

                if (0 == localIndex) {
                    let newy = oldy + node.height + 10;
                    p1 = cc.p(oldx, newy);
                    p2 = cc.p(p0.x, newy);
                } else if (1 == localIndex) {
                    let newx = oldx - node.width - 10;
                    p1 = cc.p(newx, oldy);
                    p2 = cc.p(newx, p0.y);
                } else if (2 == localIndex) {
                    let newy = oldy - node.height - 10;
                    p1 = cc.p(oldx, newy);
                    p2 = cc.p(p0.x, newy);
                } else if (3 == localIndex) {
                    let newx = oldx + node.width + 10;
                    p1 = cc.p(newx, oldy);
                    p2 = cc.p(newx, p0.y);
                }

                let acts = null;

                if (i == holds.length - 1) {
                    acts = cc.moveTo(0.3, p0);
                } else {
                    acts = cc.sequence(cc.moveTo(0.1, p1), cc.moveTo(0.1, p2), cc.moveTo(0.1, p0));
                }

                node.runAction(acts);
            }
        }
    },

    showMopai: function(seatIndex, pai) {
        let net = cc.vv.gameNetMgr;
        let localIndex = net.getLocalIndex(seatIndex);
        let side = net.getSide(localIndex);
        let sideHolds = cc.find('game/' + side + '/layout/holds', this.node);
        let mjcnt = sideHolds.childrenCount;
        let swap = (side == 'east');
        let myself = (0 == localIndex);
        let seatData = net.seats[seatIndex];
        let showBoard = (pai >= 0) && (seatData.hued || cc.vv.replayMgr.isReplay());
        let pgs = this.getPengGangsNum(seatData);
        let pos = net.numOfHolds - pgs;
        let index = swap ? 0 : pos;

        console.log('showMopai');

        if (pai == null) {
            if (mjcnt <= pos)
                return;

            let mjnode = sideHolds.children[index];

            this.putMJItem(sideHolds, localIndex, mjnode);
            return;
        }

        if (!seatData.hued)
            cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        let mjnode = this.getMJItem(sideHolds, localIndex, pos);
        let mj = mjnode.getComponent('SmartMJ');

        this.setMJLocation(mjnode, localIndex, pos, showBoard, true);

        mjnode.active = true;
        mj.setFunction(showBoard ? 1 : 0);

        if (showBoard || myself)
            mj.setMJID(pai);

        if (swap) {
            let holds = [];

            for (let i = 0; i < sideHolds.childrenCount; i++)
                holds.push(sideHolds.children[i]);

            for (let i = 0; i < holds.length; i++) {
                let child = holds[i];
                child.setSiblingIndex(i == holds.length - 1 ? 0 : i + 1);
            }
        }

        console.log('end showMopai');
    },

    updateHolds: function() {
        let net = cc.vv.gameNetMgr;
        let seats = net.seats;
        let seatData = seats[cc.vv.gameNetMgr.seatIndex];
        let holds = seatData.holds;
        if (holds == null)
            return;

        console.log('updateHolds');

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        let _holds = holds.slice(0);
        let show = (seatData.hued || cc.vv.replayMgr.isReplay());
        let sideHolds = cc.find("game/south/layout/holds", this.node);
        let total = _holds.length;

        while (sideHolds.childrenCount > total) {
            let mjnode = sideHolds.children[total];

            this.putMJItem(sideHolds, 0, mjnode);
        }

        for (let i = 0; i < total; ++i) {
            let mjid = _holds[i];
            let mjnode = this.getMJItem(sideHolds, 0, i);
            let mj = mjnode.getComponent('SmartMJ');

            this.setMJLocation(mjnode, 0, i, show, (i == net.numOfHolds));

            mj.reset();

            mjnode.y = 0;
            mjnode.active = true;

            var toSet = show ? 1 : 0;

            mj.setFunction(toSet);
            mj.setMJID(mjid);
        }

        console.log('updateHolds end');
    },

    holdsUpdated: function() {
        let sideHolds = cc.find("game/south/layout/holds", this.node);
        let total = sideHolds.childrenCount;
        let self = this;

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        for (let i = 0; i < total; i++) {
            let mjnode = sideHolds.children[i];
            let mj = mjnode.getComponent('SmartMJ');

            mj.setFunction(2);
        }

        setTimeout(function() {
            cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');
            self.initMahjongs('reset');

            let net = cc.vv.gameNetMgr;
            if (net.seatIndex == net.turn)
                self.checkChuPai(true);
        }, 500);
    },

    updateOtherHolds: function(seatData) {
        let localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0)
            return;

        let net = cc.vv.gameNetMgr;
        let side = net.getSide(localIndex);
        let game = this.node.getChildByName("game");
        let sideRoot = game.getChildByName(side);
        let sideHolds = cc.find("layout/holds", sideRoot);
        let swap = 'east' == side;

        let mjnum = seatData.holdsLen;

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        for (let i = 0; i < mjnum; i++) {
            let mjnode = this.getMJItem(sideHolds, localIndex, i);
            mjnode.active = true;
        }

        while (sideHolds.childrenCount > mjnum) {
            let mjnode = sideHolds.children[mjnum];

            this.putMJItem(sideHolds, localIndex, mjnode);
        }

        for (let i = 0; i < mjnum; i++) {
            let idx = swap ? (mjnum - 1 - i) : i;
            let mjnode = this.getMJItem(sideHolds, localIndex, idx);
            let mj = mjnode.getComponent("SmartMJ");

            this.setMJLocation(mjnode, localIndex, i, false, (i == net.numOfHolds));

            mjnode.active = true;

            mj.setFunction(0);
        }
    },

    initMahjongs: function(act) {
        let net = cc.vv.gameNetMgr;
        let seats = net.seats;
        let seatData = seats[net.seatIndex];
        let holds = this.sortHolds(seatData);
        if (holds == null)
            return;

        let reset = act == 'reset';
        let refresh = act == 'refresh';

        console.log('initMahjongs');

        let _holds = holds.slice(0);
        let show = (seatData.hued || cc.vv.replayMgr.isReplay());
        let sideHolds = cc.find("game/south/layout/holds", this.node);
        let total = _holds.length;

        while (sideHolds.childrenCount > total) {
            let mjnode = sideHolds.children[total];

            this.putMJItem(sideHolds, 0, mjnode);
        }

        for (let i = 0; i < total; ++i) {
            let mjid = _holds[i];
            let mjnode = this.getMJItem(sideHolds, 0, i);
            let mj = mjnode.getComponent('SmartMJ');

            this.setMJLocation(mjnode, 0, i, show, (!this._chipeng && (i == total - 1) && (total % 3 == 2)));

            if (reset) {
                mj.reset();
            } else if (refresh) {
                mj.refresh();
                continue;
            }

            mjnode.y = 0;
            mjnode.active = true;

            let toSet = show ? 1 : 0;

            mj.setFunction(toSet);

            mj.setMJID(mjid);
        }

        console.log('initMahjongs end');
    },

    initOtherMahjongs: function(seatData, act, hasMopai) {
        let net = cc.vv.gameNetMgr;
        let localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0)
            return;

        let reset = act == 'reset';
        let refresh = act == 'refresh';

        console.log('initOtherMahjongs');

        let side = net.getSide(localIndex);
        let game = this.node.getChildByName("game");
        let sideRoot = game.getChildByName(side);
        let sideHolds = cc.find("layout/holds", sideRoot);
        let holds = this.sortHolds(seatData);
        let swap = 'east' == side;

        if (holds != null && holds.length > 0) {
            let mjnum = holds.length;

            for (let i = 0; i < mjnum; i++) {
                let mjnode = this.getMJItem(sideHolds, localIndex, i);
                mjnode.active = true;
            }

            while (sideHolds.childrenCount > mjnum) {
                let mjnode = sideHolds.children[mjnum];

                this.putMJItem(sideHolds, localIndex, mjnode);
            }

            for (let i = 0; i < mjnum; i++) {
                let idx = swap ? (mjnum - 1 - i) : i;
                let mjnode = this.getMJItem(sideHolds, localIndex, idx);
                let mj = mjnode.getComponent("SmartMJ");
                let mjid = holds[i];

                this.setMJLocation(mjnode, localIndex, i, true, (i == mjnum - 1) && (mjnum % 3 == 2));

                mjnode.active = true;

                if (reset) {
                    mj.reset();
                } else if (refresh) {
                    mj.refresh();
                    continue;
                }

                mj.setFunction(1);
                mj.setMJID(mjid);
            }
        } else {
            let penggangs = this.getPengGangsNum(seatData);
            let mjnum = net.numOfHolds - penggangs;
            let board = seatData.hastingpai;

            if (hasMopai)
                mjnum += 1;

            for (let i = 0; i < mjnum; i++) {
                let mjnode = this.getMJItem(sideHolds, localIndex, i);
                mjnode.active = true;
            }

            while (sideHolds.childrenCount > mjnum) {
                let mjnode = sideHolds.children[mjnum];

                this.putMJItem(sideHolds, localIndex, mjnode);
            }

            for (let i = 0; i < mjnum; i++) {
                let idx = swap ? (mjnum - 1 - i) : i;
                let mjnode = this.getMJItem(sideHolds, localIndex, idx);
                let mj = mjnode.getComponent("SmartMJ");

                this.setMJLocation(mjnode, localIndex, i, board, (i == mjnum - 1) && (mjnum % 3 == 2));

                mjnode.active = true;

                if (reset) {
                    mj.reset();
                } else if (refresh) {
                    mj.refresh();
                    continue;
                }

                mj.setFunction(board ? 2 : 0);
            }
        }

        console.log('initOtherMahjongs end');
    },

     getPengGangsNum: function(seatData) {
        let num = seatData.pengs.length + seatData.angangs.length +
                  seatData.diangangs.length + seatData.wangangs.length +
                  (seatData.chis ? seatData.chis.length : 0);

        return num * 3;
    },

    onDestroy:function(){
        if (cc.vv)
            cc.vv.gameNetMgr.clear();
    }
});
