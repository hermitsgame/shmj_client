
var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_CHI = 5;
var ACTION_HU = 6;
var ACTION_ZIMO = 7;
var ACTION_TING = 8;

cc.Class({
    extends: cc.Component,

    properties: {
        _lastAction: null,
        _actionRecords: null,
        _currentIndex: 0,

        _data: null,
        _roominfo: null,
    },

    onLoad: function() {

    },

    clear: function() {
        this._lastAction = null;
        this._actionRecords = null;
        this._currentIndex = 0;
    },

    init: function(roominfo, data) {
    	
        this._actionRecords = data.action_records;
        if (this._actionRecords == null) {
            this._actionRecords = [];
        }

        this._roominfo = roominfo;
        this._data = data;

        this._currentIndex = 0;
        this._lastAction = null;
    },

    isReplay: function() {
        return this._actionRecords != null;    
    },

    gotoAction: function(index) {
        this._currentIndex = 0;
        this._lastAction = null;

        var records = this._actionRecords;
        var total = records.length / 3;

        if (index >= total) {
            return false;
        }

        var id = 0;
        while (id < index) {
            this.takeAction(true);
            id += 1;
        }

        return true;
    },

    prev: function(num) {
        var index = this._currentIndex / 3;

        if (index >= num) {
            index -= num;
        } else {
            index = 0;
        }

        var net = cc.vv.gameNetMgr;

        net.reset();
        net.prepareReplay(this._roominfo, this._data);

        this.gotoAction(index);
    },

    forward: function(num) {
        var id = 0;

        while (id < num) {
            this.takeAction(true);
            id += 1;
        }
    },

    getProgress: function() {
        let index = this._currentIndex / 3;
        let records = this._actionRecords;

        if (records == null || records == 0)
            return 0;

        let total = records.length / 3;

        return index / total;
    },

    getNextAction: function() {
        var index = this._currentIndex;
        if (index >= this._actionRecords.length) {
            return null;
        }

        var si = this._actionRecords[index];
        var action = this._actionRecords[index + 1];
        var pai = this._actionRecords[index + 2];

        this._currentIndex += 3;

        return { si: si, type: action, pai: pai };
    },

    takeAction: function(skip) {
    	var net = cc.vv.gameNetMgr;
        var action = this.getNextAction();
        if (this._lastAction != null &&
            this._lastAction.type == ACTION_CHUPAI)
        {
            if (action != null &&
                action.type != ACTION_PENG &&
                action.type != ACTION_GANG &&
                action.type != ACTION_CHI &&
                action.type != ACTION_HU)
            {
                net.doGuo(this._lastAction.si, this._lastAction.pai, skip);
            }
        }

        this._lastAction = action;
        if (action == null) {
            console.log('action null');
            return -1;
        }

        console.log('action: ' + action.type);

        var nextActionDelay = 1.0;
        if (action.type == ACTION_CHUPAI) {
            net.doChupai(action.si, action.pai, skip);
            return 1.0;
        } else if (action.type == ACTION_MOPAI) {
            net.doMopai(action.si, action.pai, skip);
            net.doTurnChange(action.si, skip);
            return 1.0;
        } else if (action.type == ACTION_PENG) {
            net.doPeng(action.si, action.pai, skip);
            net.doTurnChange(action.si, skip);
            return 1.0;
        } else if (action.type == ACTION_GANG) {
        	if (!skip) {
				net.dispatchEvent('hangang_notify', action.si);
        	}

            net.doGang(action.si, action.pai, null, null, null, skip);
            net.doTurnChange(action.si, skip);
            return 1.0;
        } else if (action.type == ACTION_CHI) {
        	net.doChi(action.si, action.pai, skip);
            net.doTurnChange(action.si, skip);
			return 1.0;
        } else if (action.type == ACTION_HU) {
            net.doHu({ seatindex: action.si, hupai: action.pai, iszimo: false }, skip);
            return 1.5;
        } else if (action.type == ACTION_ZIMO) {
            net.doHu({ seatindex: action.si, hupai: action.pai, iszimo: true }, skip);
            return 1.5;
        } else if (action.type == ACTION_TING) {
            net.doTing(action.si, null, skip);
            return 1.0;
        }

		console.log('unknown action: ' + action.type);
    }
});

