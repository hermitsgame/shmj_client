cc.Class({
    extends: cc.Component,

    properties: {
        _popuproot:null,
        _dissolveNotice:null,
        
        _menu: null,
        _audioSet: null,
        _skinSet: null,
        
        _endTime:-1,
        _lastSeconds: 0,
        _extraInfo:null,
        _noticeLabel:null, 
    },

    onLoad: function() {
        if (cc.vv == null)
            return;
        
        cc.vv.popupMgr = this;

        let btnMenu = this.node.getChildByName('btn_menu');

        cc.vv.utils.addClickEvent(btnMenu, this.node, 'PopupMgr', 'onBtnMenu');
        
        var root = cc.find("Canvas/popups");

        this._popuproot = root;

        var dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
		this._noticeLabel = cc.find('body/info', dissolveNotice).getComponent(cc.Label);

        this._dissolveNotice = dissolveNotice;
		dissolveNotice.active = false;

        this._menu = root.getChildByName('menu');

        this._audioSet = root.getChildByName('audioSet');
/*
        this._skinSet = root.getChildByName('skinSet');
*/
        this.closeAll();

		root.active = false;

        this.addBtnHandler("dissolve_notice/body/btn_agree");
        this.addBtnHandler("dissolve_notice/body/btn_reject");
        this.addBtnHandler("dissolve_notice/body/btn_dissolve");

        this.addBtnHandler('menu/btnAudio');
        //this.addBtnHandler('menu/btnSkin');
        this.addBtnHandler('menu/btnDissolve');
        this.addBtnHandler('menu/mask');

        var self = this;
        this.node.on("dissolve_notice", function(event) {
            var data = event.detail;
            self.showDissolveNotice(data);
        });

        this.node.on('dissolve_done', function(event) {
            self._endTime = -1;
            cc.vv.utils.showDialog(self._dissolveNotice, 'body', false, self._popuproot);
        });

        this.node.on("dissolve_cancel", function(event) {
            self._endTime = -1;
            cc.vv.utils.showDialog(self._dissolveNotice, 'body', false, self._popuproot);

            var data = event.detail;
            var userid = data.reject;

            if (userid != null && userid != cc.vv.userMgr.userId) {
                var seat = cc.vv.gameNetMgr.getSeatByID(userid);
                if (seat) {
                    cc.vv.alert.show('玩家' + seat.name + '已拒绝解散请求', function() {}, false);
                }
            }
        });
    },
    
    start:function() {
        if(cc.vv.gameNetMgr.dissoveData){
            this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
        }
    },

    onBtnMenu: function() {
        this.showMenu();
    },
    
    addBtnHandler:function(btnName){
        var btn = cc.find('Canvas/popups/' + btnName);
        this.addClickEvent(btn, this.node, 'PopupMgr', 'onBtnClicked');
    },
    
    addClickEvent:function(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    
    onBtnClicked:function(event) {
        var game = cc.vv.gameNetMgr;
        var net = cc.vv.net;

        this.closeAll();

        var btnName = event.target.name;
        if(btnName == "btn_agree"){
            net.send("dissolve_agree");
        }
        else if(btnName == "btn_reject"){
            net.send("dissolve_reject");
        }
        else if(btnName == "btn_sqjsfj"){
            net.send("dissolve_request"); 
        } else if (btnName == "btnAudio") {
            this.showAudioSet();
        } else if (btnName == "btnSkin") {
            //this.showSkinSet();
        } else if (btnName == "btnDissolve") {
            var isIdle = game.numOfGames == 0;
            var isOwner = game.isOwner();

            if (isIdle) {
                if (isOwner) {
                    cc.vv.alert.show('牌局还未开始，房主解散房间，房卡退还', function() {
                        net.send("dispress");
                    }, true);
                } else {
                    net.send("exit");
                }
            } else {
                net.send("dissolve_request");
            }
        } else if (btnName == "btn_dissolve") {
            net.send("dissolve_request");
        } else if (btnName == 'mask') {
            this.closeAll();
        }
    },
    
    closeAll: function() {
        //this._popuproot.active = false;

        this._audioSet.active = false;
/*
        this._skinSet.active = false;
*/
        this._menu.active = false;
    },
    
    showMenu: function() {
        let show = this._popuproot.active && this._menu.active;

        this.closeAll();
        
        if (!show) {
            this._popuproot.active = true;
            this._menu.active = true;

            let isReplay = cc.vv.replayMgr.isReplay();
            let btnDissolve = cc.find('Canvas/popups/menu/btnDissolve');
            let spmgr = btnDissolve.getComponent('SpriteMgr');

            btnDissolve.getComponent(cc.Button).interactable = !isReplay;

            if (!isReplay)
                spmgr.setIndex(cc.vv.gameNetMgr.numOfGames == 0 ? 1 : 0);
        }
    },
    
    showAudioSet: function() {
        this.closeAll();
        this._popuproot.active = true;

        cc.vv.utils.showDialog(this._audioSet, 'body', true);
    },
    
    showSkinSet: function() {
        this.closeAll();
        this._popuproot.active = true;

        cc.vv.utils.showDialog(this._skinSet, 'body', true);
    },
    
    showDissolveRequest: function() {
        this.closeAll();
        this._popuproot.active = true;
    },

    showDissolveNotice: function(data) {
        this._endTime = Date.now()/1000 + data.time;
        let dn = this._dissolveNotice;
        let body = dn.getChildByName('body');
        let seats = body.getChildByName('seats');
        let net = cc.vv.gameNetMgr;

        if (!(dn.active && this._popuproot.active)) {
            this.closeAll();
            this._popuproot.active = true;

            cc.vv.utils.showDialog(dn, 'body', true);

            let index = 0;
            for (let i = 0; i < seats.childrenCount && i < net.seats.length; i++, index++) {
                let seat = seats.children[i];
                let icon = cc.find('mask/icon', seat);
                let imageLoader = icon.getComponent('ImageLoader');
                let name = seat.getChildByName('name').getComponent(cc.Label);

                seat.active = true;
                imageLoader.setUserID(net.seats[i].userid);
                name.string = net.seats[i].name.slice(0, 5);
            }

            for (let i = index; i < seats.childrenCount; i++) {
                let seat = seats.children[i];

                seat.active = false;
            }
        }

        let notice = ['(等待中)', '(拒绝)', '(同意)', '(离线)'];

        for (let i = 0; i < seats.childrenCount && i < net.seats.length; i++) {
            let seat = seats.children[i];
            let status = seat.getChildByName('status');
            let sprite = status.getComponent('SpriteMgr');
            let state = data.states[i];
            let index = 0;

            if (state > 2)
                index = 4;

            let online = data.online[i];
            if (state <= 2) {
                if (!online)
                    index = 3;
                else
                    index = state;
            }

            sprite.setIndex(index);
        }
        
        let check = [ false, false, false, false ];
        
        let btnAgree = body.getChildByName('btn_agree');
        let btnReject = body.getChildByName('btn_reject');
        let btnDissolve = body.getChildByName('btn_dissolve');
        //let wait = body.getChildByName('wait');
        let seatIndex = net.seatIndex;
        let state = data.states[seatIndex];
        
        if (data.reason == 'offline') {
            check[2] = true;
        } else {
            if (state == 0) {
                check[0] = true;
                check[1] = true;
            } else {
                check[3] = true;
            }
        }
        
        btnAgree.active = check[0];
        btnReject.active = check[1];
        btnDissolve.active = check[2];
        //wait.active = check[3];
    },

    update: function (dt) {
        if (this._endTime > 0) {
            var now = Date.now() / 1000;
            
            if (now == this._lastSeconds) {
                return;
            }
            
            this._lastSeconds = now;
            
            var lastTime = this._endTime - now;
            if (lastTime < 0) {
                this._endTime = -1;
                return;
            }

            var h = Math.floor(lastTime / 3600)
            var m = Math.floor((lastTime % 3600) / 60);
            var s = Math.ceil(lastTime % 60);

            h = h < 10 ? '0' + h : '' + h;
            m = m < 10 ? '0' + m : '' + m;
            s = s < 10 ? '0' + s : '' + s;
            
            this._noticeLabel.string = h + ':' + m + ':' + s + ' 后将解散房间';
        }
    },
});
