

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
        _maima: null,

        _acting: 0,
        _gameover: null,

        _tempHolds: [],
        _tempPrompt: null,

        _tempFlowers: [],

        _chipeng: false,
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

        this.initView();
        this.initEventHandlers();

        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this.initWanfaLabel();
        this.onGameBegin();

        cc.vv.audioMgr.playBackGround();
    },

    initView: function() {
    	var net = cc.vv.gameNetMgr;
        var gameChild = this.node.getChildByName("game");

        this._mjcount = cc.find("mj_count/mj_count", gameChild).getComponent(cc.Label);
        this._mjcount.string = net.numOfMJ;
        this._gamecount = cc.find("Canvas/infobar/room/game_count").getComponent(cc.Label);
        this._gamecount.string = "" + net.numOfGames + " / " + net.maxNumOfGames;

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

        this._maima = cc.find('Canvas/maima');
        this.hideMaiMa();

        var prompts = gameChild.getChildByName("prompts");
        this._tempPrompt = prompts.children[0];
        prompts.removeAllChildren();
        prompts.active = false;
    },

    showTingPrompts: function(tings) {
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

    hideMaiMa: function() {
        this._maima.active = false;
    },

    showMaiMa: function(ma, fan, cb) {
        cb();
        return;
/*
        var maima = this._maima;
        var board = maima.getChildByName('board');
        var tile = board.getChildByName('tile').getComponent('SpriteMgr');
        var layout = maima.getChildByName('layout');
        var num = layout.getChildByName('num').getComponent(cc.Label);
        var anim = board.getComponent(cc.Animation);
        var style = cc.vv.mahjongmgr.getMJStyle();

        maima.active = true;
        tile.setIndex(-1);
        layout.active = false;

        var self = this;

        var fn = function() {
            layout.active = true;
            num.string = fan;
            
            var mj = ma < 18 ? ma : ma - 9;
            tile.setIndex(mj);

            setTimeout(function() {
                maima.active = false;
                if (cb) {
                    cb();
                }
            }, 2000);
            
            anim.off('finished', fn);
        };

        anim.on('finished', fn);

        console.log('showMaiMa');

        anim.play('maima1');    // TODO
*/
    },
    
    hideChupai:function() {
        for (var i = 0; i < this._chupais.length; ++i) {
            this._chupais[i].active = false;
        }
    },

	updateFlowers: function(sd) {
		var net = cc.vv.gameNetMgr;
		var seats = sd ? [ sd ] : net.seats;
		var gameChild = this.node.getChildByName("game");
		var cards = [ 45, 46, 47, 51, 52, 53, 54, 55, 56, 57, 58 ];
		var self = this;

		var getFlower = function(flowers, localidx, id) {
			var temp = self._tempFlowers[localidx];

			if (flowers.childrenCount > id) {
				return flowers.children[id];
			}

			var _fl = cc.instantiate(temp);
			flowers.addChild(_fl);

			return _fl;
		};

		console.log('updateFlowers');

		for (var i = 0; i < seats.length; i++) {
			var seat = seats[i];
			if (!seat || seat.flowers == null)
				continue;

			var seatindex = net.getSeatIndexByID(seat.userid);
			var local = net.getLocalIndex(seatindex);
			var side = net.getSide(local);
			var flowers = cc.find(side + '/flowers', gameChild);
			var index = 0;

			console.log('seat ' + i + ' flowers ' + seat.flowers.length);
			flowers.active = seat.flowers.length > 0;
			if (seat.flowers.length == 0)
				continue;

			var fls = {};
			for (var j = 0; j < seat.flowers.length; j++) {
				var fl = seat.flowers[j];

				if (fls[fl] == null) {
					fls[fl] = 1;
				} else {
					fls[fl] += 1;
				}
			}

			console.log(fls);

			for (var key in fls) {
				var pai = parseInt(key);
				var off = cards.indexOf(pai);
				if (off == -1) {
					console.log('card not found ' + pai);
					continue;
				}

				var item = getFlower(flowers, local, index);
				var tile = item.getChildByName('tile').getComponent('SpriteMgr');
				var num = item.getChildByName('num').getComponent(cc.Label);

				tile.setIndex(off);
				num.string = fls[key];

				index++;
			}

			while (flowers.childrenCount > index) {
				var child = flowers.children[index];
				flowers.removeChild(child);
			}
		}
    },

    showTingOpt: function(enable) {
        this._tingOpt.active = enable;
    },

    showGangOpt: function(enable) {
        this._gangOpt.active = enable;
    },

    initEventHandlers: function() {
        var node = this.node;
        var self = this;
        var net = cc.vv.gameNetMgr;

        net.dataEventHandler = node;		

        node.on('game_holds', function(data) {
           self.initMahjongs();
        });

        node.on('game_holds_update', function(data) {
            self.updateHolds();
        });

        node.on('game_holds_len', function(data) {
            self.updateOtherHolds(data.detail);
        });

        node.on('game_holds_updated', function(data) {
            self.holdsUpdated();
        });

        node.on('game_begin', function(data) {
            cc.vv.audioMgr.playSFX('Sound/GAME_START0.mp3');
            self.onGameBegin();
        });

        node.on('game_sync', function(data) {
            console.log('game sync');
            if (cc.vv.gameNetMgr.isPlaying()) {
                self.onGameSync();
            }
        });

        node.on('game_chupai', function(data) {
            self.hideChupai();
        });

        node.on('game_mopai',function(data) {
            var detail = data.detail;
            self.hideChupai();
            self.showMopai(detail.seatIndex, detail.pai);

            var localIndex = cc.vv.gameNetMgr.getLocalIndex(detail.seatIndex);
            if (0 == localIndex) {
                self.checkChuPai(true);
                self.checkTingPai(true);
                self.showTings(true);
            }
        });

        node.on('game_action', function(data) {
            self.showAction(data.detail);
        });

        node.on('user_hf_updated', function(data) {
            console.log('user_hf_updated');
            self.updateFlowers(data.detail);
        });

        node.on('hupai',function(data) {
            var data = data.detail;
            var net = cc.vv.gameNetMgr;
            var seatIndex = data.seatindex;
            var localIndex = net.getLocalIndex(seatIndex);
            var hupai = self._hupaiTips[localIndex];
            var iszimo = data.iszimo;

            hupai.active = true;

            if (localIndex == 0) {
                self.hideOptions();
            }

            var seatData = net.seats[seatIndex];
            seatData.hued = true;
            var type = net.conf.type;

            hupai.getChildByName("sprHu").active = true;

            if (data.holds) {
                seatData.holds = data.holds;
                seatData.holds.push(data.hupai);
            }

            if (seatData.seatindex == net.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }

            if (cc.vv.replayMgr.isReplay()) {
                var action = data.iszimo ? 'zimo' : 'hu';

                self.playEfx(localIndex, action);
                cc.vv.audioMgr.playDialect('hu', seatData.userid);
            }
        });

        node.on('mj_count',function(data) {
            self._mjcount.string = cc.vv.gameNetMgr.numOfMJ;
        });

        node.on('game_num', function(data) {
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + " / " + cc.vv.gameNetMgr.maxNumOfGames;
        });

        node.on('game_over', function(data) {
            var go_data = data.detail;

            self.playHuAction(go_data.results, ()=>{
                setTimeout(()=>{
    				self.doGameOver(go_data);
                }, 3000);
            });
        });

        node.on('game_chupai_notify', function(data) {
            self.hideChupai();
            var seatData = data.detail.seatData;
            var pai = data.detail.pai;

            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.doChupai(seatData, pai);
                self.checkChuPai(false);
                self.showTingPrompts();
            } else {
                self.doChupai(seatData, pai);
            }

            self.showChupai();
            var content = cc.vv.mahjongmgr.getAudioContentByMJID(pai);
            cc.vv.audioMgr.playDialect(content, seatData.userid);
        });

        node.on('guo_notify',function(data){
            self.hideChupai();
            self.hideOptions();
            var seatData = data.detail;
        });

        node.on('guo_result',function(data) {
            self.hideOptions();
        });

        node.on('peng_notify', function(data) {
            self.hideChupai();

            var seatData = data.detail.seatData;
            self._chipeng = true;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
                self.checkChuPai(true);
                self.checkTingPai();
                self.showTings(true);
            } else {
                self.initOtherMahjongs(seatData, '', true);
            }

            self._chipeng = false;
            var localIndex = self.getLocalIndex(seatData.seatindex);

            self.playEfx(localIndex, 'peng');
            cc.vv.audioMgr.playDialect('peng', seatData.userid);

            self.hideOptions();
        });

        node.on('ting_notify', function(data) {
            var seatData = data.detail;
            var localIndex = self.getLocalIndex(seatData.seatindex);
            var ting = self._tingFlags[localIndex];

            ting.active = true;
            if(seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                //self.initMahjongs();
                self.updateTingpai(localIndex, seatData.tings);
                self.checkChuPai(true);
            } else {
                self.initOtherMahjongs(seatData);
            }

            self.playEfx(localIndex, 'ting');
            //cc.vv.audioMgr.playAction('ming');
        });

        node.on('chi_notify', function(data) {
            self.hideChupai();

            var seatData = data.detail.seatData;
            var pai = data.detail.pai;
            self._chipeng = true;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
                self.checkChuPai(true);
                self.checkTingPai();
                self.showTings(true);
            }
            else {
                self.initOtherMahjongs(seatData, '', true);

                var net = cc.vv.gameNetMgr;
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

        node.on('gang_notify',function(info) {
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

        node.on("hangang_notify",function(data){
            var data = data.detail;
            var localIndex = self.getLocalIndex(data);
            self.hideOptions();
        });

        node.on('refresh_mj', function() {
            self.refreshMJ();
        });

        node.on('refresh_bg', function(data) {
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

        var gameover = this.node.getComponent('GameOver');
        gameover.onGameOver(data);
    },

    playHuAction: function(data, cb) {
        var results = data;
        var done = 0;
        var maima = null;
        var self = this;
        var net = cc.vv.gameNetMgr;
        var nSeats = net.numOfSeats;
        var seats = net.seats;

        var fnCB = function() {
            console.log('fbCB');
            done += 1;

            if (done == nSeats) {
                if (maima) {
                        self.showMaiMa(maima.pai, maima.fan, function() {
                        if (cb) {
                            cb();
                        }
                    });
                } else {
                    if (cb) {
                        cb();
                    }
                }
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

        for (var i = 0; i < results.length; i++) {
            var result = results[i];

            if (result.maima) {
                maima = result.maima;
                break;
             }
        }

        for (var i = 0; i < results.length; i++) {
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var result = results[i];
            var hu = result.hu;
            var actions = [];

			if (!hu) {
				fnCB();
				continue;
			}

			hu.index = localIndex;
			hu.userid = seats[i].userid;

			var act = hu.action;

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
        if (!this.gameRoot.active) {
                return;
        }

        this.initMahjongs('refresh');
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if(localIndex != 0) {
                this.initOtherMahjongs(seatData, 'refresh');
            }
        }

        for (var i = 0; i < this._huTemplates.length; i++) {
            var temp = this._huTemplates[i];
            var mj = temp.getComponent('Majiang');
            mj.refresh();
        }

        for (var i = 0; i < this._huPrompts.length; i++) {
            var prompt = this._huPrompts[i];
            var hulist = cc.find("hupais/hulist", prompt);

            for (var j = 0; j < hulist.childrenCount; j++) {
                var pai = hulist.children[j];
                var mj = pai.getComponent('Majiang');
                mj.refresh();
            }
        }

        for (var i = 0; i < this._chupais.length; i++) {
            var chupai = this._chupais[i];
            var mj = chupai.getChildByName('south_meld').getComponent('Majiang');
            mj.refresh();
        }
/*
		var prompts = cc.find('game/prompts', this.node);
		for (var i = 0; i < prompts.childrenCount; i++) {
			var prompt = prompts.children[i];
			var mj = prompt.getChildByName('south_hand').getComponent('Majiang');
            mj.refresh();
		}
*/
		this._tempPrompt.getChildByName('south_hand').getComponent('Majiang').refresh();
    },

    showChupai: function() {
        var pai = cc.vv.gameNetMgr.chupai;
        if( pai >= 0 ) {
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var chupai = this._chupais[localIndex];
			var mj = chupai.getChildByName('south_meld').getComponent('Majiang');

            mj.setMJID(pai);
            chupai.active = true;

			var self = this;

			setTimeout(function() {
				chupai.active = false;
			}, 800);
        }
    },

    addOption: function(name) {
        var ops = [ "peng", "gang", "hu", "chi", "ting", "guo" ];

        var id = ops.indexOf(name);
        if (id == -1) {
            console.log("addOption: unknown option name");
            return;
        }

        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op" && child.active == false) {
                child.active = true;

                var sprite = child.getComponent("SpriteMgr");
                sprite.setIndex(id);
                break;
            }
        }
    },

    hideOptions:function(data) {
        var options = this._options;
        options.active = false;
        for (var i = 0; i < options.childrenCount; ++i) {
            var child = options.children[i];
            if (child.name == "op") {
                child.active = false;
            }
        }
    },

    hasOptions: function() {
        return this._options.active;
    },

    showAction: function(data) {
        var options = this._options;
        this._optionsData = data;
        var net = cc.vv.net;

        if (options.active) {
            this.hideOptions();
        }

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
        var wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },

    updateTingpai: function(localIndex, tings) {
        var huPrompt = this._huPrompts[localIndex];
        var huTemplate = this._huTemplates[localIndex];
        var wc = cc.vv.wildcard;

        var hupais = huPrompt.getChildByName('hupais');
        var hulist = hupais.getChildByName('hulist');

        hulist.removeAllChildren();

        for (var i = 0; i < tings.length; i++) {
            var hu = cc.instantiate(huTemplate);
            var mj = hu.getComponent("Majiang");

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

        this._mjcount.string = net.numOfMJ;
        this._gamecount.string = "" + net.numOfGames + " / " + net.maxNumOfGames;

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

        var target = event.target;
        var holds = cc.find("game/south/layout/holds", this.node);

        for (var i = 0; i < holds.childrenCount; i++) {
            var mjnode = holds.children[i];
            var mj = mjnode.getComponent('SmartMJ');

            if (target == mjnode) {
                if (this._gangState == 0) {
                    if (this._selectedMJ != null) {
                        this._selectedMJ.y = 0;
                    }

                    this.onMJChoosed(mj);
                    return;
                } else {
                    if (target == this._selectedMJ) {
                        this.shoot(target);
                        this._selectedMJ.y = 0;
                        this._selectedMJ = null;
						this.showTingPrompts();
                        return;
                    }

                    if (this._selectedMJ != null) {
                        this._selectedMJ.y = 0;
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
        var mjid = mj.mjid;
        var options = this._optionsData;
        var net = cc.vv.gameNetMgr;
        var wc = cc.vv.wildcard;
        var seats = net.seats;
        var seatData = seats[net.seatIndex];
        var holds = seatData.holds;

        if (this._tingState == 0) {
            var tings = wc.getTings(seatData, mjid);
            this.showTingPrompts(tings);
        } else if (this._gangState == 0) {
            this.enterGangState(1, mjid);
        } else {
            if (options) {
                var tings = wc.getTings(seatData, mjid);
                this.showTingPrompts(tings);
            }
        }
    },

    shoot: function(mjnode) {
        if (mjnode == null) {
            return;
        }

        var net = cc.vv.net;
        var mj = mjnode.getComponent('SmartMJ');
        var mjid = mj.mjid;

        this._lastChupai = mjnode;

        if (this._tingState == 0) {
            this.enterTingState(1, mjid);
        } else {
        if (this.hasOptions()) {
            net.send("guo");
        }

        this.showTings(false);

        net.send('chupai', mjid);
        }

        this._optionsData = null;
    },

    checkChuPai: function(check) {
        var net = cc.vv.gameNetMgr;
        var seatData = net.getSelfData();
        var hastingpai = seatData.hastingpai;

        var holds = cc.find("game/south/layout/holds", this.node);
        var mjcnt = holds.childrenCount;

        if (cc.vv.replayMgr.isReplay())
            return;

        console.log('checkChuPai');

        if (check) {
            if (hastingpai) {
                for (var i = 0; i < mjcnt; ++i) {
                    var mjnode = holds.children[i];
                    var mj = mjnode.getComponent('SmartMJ');

                    if (mjnode.active) {
                        mj.setInteractable((i == mjcnt - 1) && (mjcnt % 3 == 2));
                    }
                }
            } else {
                for (var i = 0; i < mjcnt; ++i) {
                    var mjnode = holds.children[i];
                    var mj = mjnode.getComponent('SmartMJ');
                    var mjid = mj.mjid;

                    var can = !(seatData.lastChiPai && seatData.lastChiPai == mjid);
                    console.log('1290: setInteractable: ' + can);
                    mj.setInteractable(can);
                }
	    }
        } else {
            for (var i = 0; i < mjcnt; ++i) {
                var mjnode = holds.children[i];
                var mj = mjnode.getComponent('SmartMJ');

                mj.setInteractable(false);
            }
        }
    },

    checkGangPai: function() {
        var holds = cc.find("game/south/layout/holds", this.node);
        var mjcnt = holds.childrenCount;
        var options = this._optionsData;
        var gp = options.gangpai;

        for (var i = 0; i < mjcnt; i++) {
            var mjnode = holds.children[i];
            var mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active) {
                continue;
            }

            var mjid = mj.mjid;

            var gang = (gp.indexOf(mjid) != -1);

            mj.setInteractable(gang);
        }
    },
    
    checkTingPai: function() {
        var holds = cc.find("game/south/layout/holds", this.node);
		var mjcnt = holds.childrenCount;
        var tingouts = this._optionsData.tingouts;
        
        for (var i = 0; i < mjcnt; i++) {
            var mjnode = holds.children[i];
			var mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active) {
                continue;
            }

            var mjid = mj.mjid;
            var ting = (tingouts.indexOf(mjid) != -1);

            mj.setInteractable(ting);
            console.log('1342: setInteractable: ' + ting);
            mj.setTing(ting);
        }
    },

    showTings: function(enable) {
        var holds = cc.find("game/south/layout/holds", this.node);
		var mjcnt = holds.childrenCount;

        for (var i = 0; i < mjcnt; i++) {
			var mjnode = holds.children[i];
			var mj = mjnode.getComponent('SmartMJ');

            if (!mjnode.active) {
                continue;
            }

            var ting = enable && (this._optionsData.tingouts.indexOf(mj.mjid) != -1);

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

    onOptionClicked: function(event) {
        var target = event.target;
        var spriteMgr = target.getComponent("SpriteMgr");
        var index = spriteMgr.index;
        var net = cc.vv.net;
        var data = this._optionsData;

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
                var pai = data.pai;
                var types = data.chitypes;

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

        var options = this._optionsData;
        var gp = options.gangpai;
        var net = cc.vv.net;

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
                net.send("gang", pai);
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

    // TODO
    doTing: function(seatData) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var sideHolds = cc.find('game/' + side + '/layout/holds', this.node);

        for (var i = 0; i < sideHolds.childrenCount; i++) {
            var child = sideHolds.children[i];
            var mj = child.getComponent('SmartMJ');

            mj.setFunction(1);
        }
    },
	
    enterTingState: function(state, pai) {
        this._tingState = state;

        var options = this._optionsData;
        var net = cc.vv.net;
        var mgr = cc.vv.mahjongmgr;
        var seatData = cc.vv.gameNetMgr.getSelfData();
        var holds = seatData.holds;

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
        var start = 0;
        var xoff = 0;
        var yoff = 0;

        if (0 == localIndex) {
            start = 42.5;
            xoff = 83;
        } else if (localIndex == 1) {
            start = 32;
            yoff = 32;
        } else if (localIndex == 2) {
            start = -20.5;
            xoff = -39;
        } else if (localIndex == 3) {
            start = -32;
            yoff = -32;
        }

        if (xoff != 0) {
            var x = start + xoff * id;

            return cc.p(x, 0);
        } else if (yoff != 0) {
            var y = start + yoff * id;

            return cc.p(0, y)
        }
    },

	setMJLocation: function(mjnode, localIndex, index, board, mopai) {
		var start = 0;
		var xoff = 0;
		var yoff = 0;
		var barrier = 0;
		var id = index;

		if (localIndex == 0) {
			start = 42.5;
			xoff = 83;

			if (mopai) {
				barrier = 20;
			}
		} else if (localIndex == 1) {
			if (board) {
				start = 32
				yoff = 32;
			} else {
				start = 29;
				yoff = 36;
			}

			if (mopai) {
				barrier = 20;
			}
		} else if (localIndex == 2) {
			if (board) {
				start = -20.5;
				xoff = -39;
			} else {
				start = -22;
				xoff = -41;
			}

			if (mopai) {
				barrier = -20;
			}
		} else if (localIndex == 3) {
			if (board) {
				start = -32;
				yoff = -32;
			} else {
				start = -29;
				yoff = -36;
			}

			if (mopai) {
				barrier = -20;
			}
		}

		if (xoff != 0) {
			var x = start + xoff * id + barrier;

			mjnode.x = x;
			mjnode.y = 0;
		} else if (yoff != 0) {
			var y = start + yoff * id + barrier;

			mjnode.y = y;
			mjnode.x = 0;
		}
    },

    sortHolds: function(seatData) {
        var holds = seatData.holds;
        if (holds == null) {
            return null;
        }

        var mopai = null;

        if (!this._chipeng) {
            var l = holds.length;
            if (l % 3 == 2)
                mopai = holds.pop();
        }

        cc.vv.gameNetMgr.sortMJ(holds);

        if (mopai != null)
            holds.push(mopai);

        return holds;
    },

    doChupai: function(seatData, pai) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.gameNetMgr.getSide(localIndex);
        var sideHolds = cc.find('game/' + side + '/layout/holds', this.node);

        var mjcnt = sideHolds.childrenCount;
        var swap = (side == 'east');
        var myself = (0 == localIndex);

        var moid = swap ? 0 : mjcnt - 1;
        var mopaiNode = sideHolds.children[moid];

        if ( mopaiNode == undefined )
        {
            console.log(mjcnt, moid);
            console.log("falls undefined");
        }

        var mopai = mopaiNode.getComponent('SmartMJ');
        var mopaiId = mopai.mjid;
        var folds = this.node.getComponent('Folds');

        var show = (myself || seatData.hued || cc.vv.replayMgr.isReplay());

        cc.vv.audioMgr.playSFX('Sound/OUT_CARD0.mp3');

        if (!show) {
            var pos = mopaiNode.parent.convertToWorldSpaceAR(mopaiNode.position);

            folds.doChupai(seatData, pai, pos);
            this.putMJItem(sideHolds, localIndex, mopaiNode);
            return;
        }

        var mjnode = null;

        if (myself) {
            mjnode = this._lastChupai;
            this._lastChupai = null;
        }

        if (mjnode == null && mopaiId == pai) {
            mjnode = mopaiNode;
        }

        for (var i = 0; i < mjcnt; i++) {
            var node = sideHolds.children[i];
            var mj = node.getComponent('SmartMJ');

            node.oldID = swap ? (mjcnt - 1 - i) : i;

            if (mjnode == null && mj.mjid == pai) {
                mjnode = node;
            }
        }

        if (!mjnode) {
            console.log('mjnode not found!');
        }

        var pos = sideHolds.convertToWorldSpaceAR(mjnode.position);

        this.putMJItem(sideHolds, localIndex, mjnode);
        folds.doChupai(seatData, pai, pos);

        if (mopaiNode == mjnode) {
            return;
        }

        var holds = [];

        mjcnt = sideHolds.childrenCount;

        for (var i = 0; i < mjcnt - 1; i++) {
            var node = sideHolds.children[swap ? (mjcnt - 1 - i) : i];

            holds.push(node);
        }

        var max = 0;
        var _holds = [];

        for (var i = 0; i < holds.length; i++) {
            var mj = holds[i].getComponent('SmartMJ');

            _holds.push(mj.mjid);
        }

        _holds.push(mopaiId);
        cc.vv.gameNetMgr.sortMJ(_holds);

        for (var i = 0; i < _holds.length; i++) {
            var pai = _holds[i];

            if (pai == mopaiId) {
                max = i;
            }
        }

        holds.splice(max, 0, mopaiNode);

        for (var i = 0; i < holds.length; i++) {
            var node = holds[i];

            var p0 = this.getMJPosition(localIndex, i);

            node.setSiblingIndex(swap ? (mjcnt - 1 - i): i);

            if (node != mopaiNode) {
                if (i != node.oldID) {
                    node.runAction(cc.moveTo(0.3, p0));
                }
            } else {
                var oldx = node.x;
                var oldy = node.y;
                var p1 = null;
                var p2 = null;

                if (0 == localIndex) {
                    var newy = oldy + node.height + 10;
                    p1 = cc.p(oldx, newy);
                    p2 = cc.p(p0.x, newy);
                } else if (1 == localIndex) {
                    var newx = oldx - node.width - 10;
                    p1 = cc.p(newx, oldy);
                    p2 = cc.p(newx, p0.y);
                } else if (2 == localIndex) {
                    var newy = oldy - node.height - 10;
                    p1 = cc.p(oldx, newy);
                    p2 = cc.p(p0.x, newy);
                } else if (3 == localIndex) {
                    var newx = oldx + node.width + 10;
                    p1 = cc.p(newx, oldy);
                    p2 = cc.p(newx, p0.y);
                }

                var acts = null;

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
        var netMgr = cc.vv.gameNetMgr;
        var localIndex = netMgr.getLocalIndex(seatIndex);
        var side = netMgr.getSide(localIndex);
        var sideHolds = cc.find('game/' + side + '/layout/holds', this.node);
        var mjcnt = sideHolds.childrenCount;
        var swap = (side == 'east');
        var myself = (0 == localIndex);
        var seatData = netMgr.seats[seatIndex];
        var showBoard = (pai >= 0) && (seatData.hued || cc.vv.replayMgr.isReplay());
        var pgs = this.getPengGangsNum(seatData);
        var pos = netMgr.numOfHolds - pgs;
        var index = swap ? 0 : pos;

        console.log('showMopai');

        if (pai == null) {
            if (mjcnt <= pos) {
                return;
            }

            var mjnode = sideHolds.children[index];

            this.putMJItem(sideHolds, localIndex, mjnode);
            return;
        }

        if (!seatData.hued)
            cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        var mjnode = this.getMJItem(sideHolds, localIndex, pos);
        var mj = mjnode.getComponent('SmartMJ');

        this.setMJLocation(mjnode, localIndex, pos, showBoard, true);

        mjnode.active = true;
        mj.setFunction(showBoard ? 1 : 0);

        if (showBoard || myself) {
            mj.setMJID(pai);
        }

        if (swap) {
            var holds = [];

            for (var i = 0; i < sideHolds.childrenCount; i++) {
                holds.push(sideHolds.children[i]);
            }

            for (var i = 0; i < holds.length; i++) {
                var child = holds[i];
                child.setSiblingIndex(i == holds.length - 1 ? 0 : i + 1);
            }
        }

		console.log('end showMopai');
    },

    updateHolds: function() {
        var net = cc.vv.gameNetMgr;
        var seats = net.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var holds = seatData.holds;
        if (holds == null) {
            return;
        }

        console.log('updateHolds');

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        var _holds = holds.slice(0);

        var show = (seatData.hued || cc.vv.replayMgr.isReplay());
        var sideHolds = cc.find("game/south/layout/holds", this.node);
        var total = _holds.length;

        while (sideHolds.childrenCount > total) {
            var mjnode = sideHolds.children[total];

            this.putMJItem(sideHolds, 0, mjnode);
        }

        for (var i = 0; i < total; ++i) {
            var mjid = _holds[i];
            var mjnode = this.getMJItem(sideHolds, 0, i);
            var mj = mjnode.getComponent('SmartMJ');

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
        var sideHolds = cc.find("game/south/layout/holds", this.node);
        var total = sideHolds.childrenCount;
        var self = this;

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        for (var i = 0; i < total; i++) {
            var mjnode = sideHolds.children[i];
            var mj = mjnode.getComponent('SmartMJ');

            mj.setFunction(2);
        }

        setTimeout(function() {
            cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');
            self.initMahjongs('reset');

            var net = cc.vv.gameNetMgr;
            if (net.seatIndex == net.turn) {
                self.checkChuPai(true);
            }
        }, 500);
    },

    updateOtherHolds: function(seatData) {
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0) {
            return;
        }

        var net = cc.vv.gameNetMgr;
        var side = net.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = cc.find("layout/holds", sideRoot);
        var swap = 'east' == side;

        var mjnum = seatData.holdsLen;

        cc.vv.audioMgr.playSFX('Sound/SEND_CARD0.mp3');

        for (var i = 0; i < mjnum; i++) {
            var mjnode = this.getMJItem(sideHolds, localIndex, i);
            mjnode.active = true;
        }

        while (sideHolds.childrenCount > mjnum) {
            var mjnode = sideHolds.children[mjnum];

            this.putMJItem(sideHolds, localIndex, mjnode);
        }

        for (var i = 0; i < mjnum; i++) {
            var idx = swap ? (mjnum - 1 - i) : i;
            var mjnode = this.getMJItem(sideHolds, localIndex, idx);
            var mj = mjnode.getComponent("SmartMJ");

            this.setMJLocation(mjnode, localIndex, i, false, (i == net.numOfHolds));

            mjnode.active = true;

            mj.setFunction(0);
        }
    },

    initMahjongs: function(act) {
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var holds = this.sortHolds(seatData);
        if (holds == null)
            return;

        var reset = act == 'reset';
        var refresh = act == 'refresh';

        console.log('initMahjongs');

        var _holds = holds.slice(0);

        var show = (seatData.hued || cc.vv.replayMgr.isReplay());

        var sideHolds = cc.find("game/south/layout/holds", this.node);
        var total = _holds.length;

        while (sideHolds.childrenCount > total) {
            var mjnode = sideHolds.children[total];

            this.putMJItem(sideHolds, 0, mjnode);
        }

        for (var i = 0; i < total; ++i) {
            var mjid = _holds[i];
            var mjnode = this.getMJItem(sideHolds, 0, i);
            var mj = mjnode.getComponent('SmartMJ');

            this.setMJLocation(mjnode, 0, i, show, (!this._chipeng && (i == total - 1) && (total % 3 == 2)));

            if (reset) {
                mj.reset();
            } else if (refresh) {
                mj.refresh();
                continue;
            }

            mjnode.y = 0;
            mjnode.active = true;

            var toSet = show ? 1 : 0;

            mj.setFunction(toSet);

            mj.setMJID(mjid);
        }

        console.log('initMahjongs end');
    },

    initOtherMahjongs: function(seatData, act, hasMopai) {
        var net = cc.vv.gameNetMgr;

        var localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0)
            return;

        var reset = act == 'reset';
        var refresh = act == 'refresh';

        console.log('initOtherMahjongs');

        var side = net.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = cc.find("layout/holds", sideRoot);
        var holds = this.sortHolds(seatData);
        var swap = 'east' == side;

        if (holds != null && holds.length > 0) {
            var mjnum = holds.length;

            for (var i = 0; i < mjnum; i++) {
                var mjnode = this.getMJItem(sideHolds, localIndex, i);
                mjnode.active = true;
            }

            while (sideHolds.childrenCount > mjnum) {
                var mjnode = sideHolds.children[mjnum];

                this.putMJItem(sideHolds, localIndex, mjnode);
            }

            for (var i = 0; i < mjnum; i++) {
                var idx = swap ? (mjnum - 1 - i) : i;
                var mjnode = this.getMJItem(sideHolds, localIndex, idx);
                var mj = mjnode.getComponent("SmartMJ");
                var mjid = holds[i];

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
            var penggangs = this.getPengGangsNum(seatData);
            var mjnum = net.numOfHolds - penggangs;
            var board = seatData.hastingpai;

            if (hasMopai) {
                mjnum += 1;
            }

            for (var i = 0; i < mjnum; i++) {
                var mjnode = this.getMJItem(sideHolds, localIndex, i);
                    mjnode.active = true;
            }

            while (sideHolds.childrenCount > mjnum) {
                var mjnode = sideHolds.children[mjnum];

                this.putMJItem(sideHolds, localIndex, mjnode);
            }

            for (var i = 0; i < mjnum; i++) {
                var idx = swap ? (mjnum - 1 - i) : i;
                var mjnode = this.getMJItem(sideHolds, localIndex, idx);
                var mj = mjnode.getComponent("SmartMJ");

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
        var num = seatData.pengs.length + seatData.angangs.length +
                  seatData.diangangs.length + seatData.wangangs.length +
                  (seatData.chis ? seatData.chis.length : 0);

        return num * 3;
    },

    onDestroy:function(){
        if (cc.vv) {
            cc.vv.gameNetMgr.clear();
        }
    }
});
