
cc.Class({
    extends: cc.Component,

    properties: {
        _bar : null,
        _percent : null
    },

    onLoad: function() {
        this._bar = this.node.getChildByName('bar').getComponent(cc.Sprite);
        this._percent = this.node.getChildByName('percent').getComponent(cc.Label);
    },

    setPercent : function(percent) {
        this._bar.fillRange = percent;
        this._percent.string = Math.floor(percent * 100) + '%';
    }
});

