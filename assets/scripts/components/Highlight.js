
cc.Class({
    extends: cc.Component,

    properties: {
        atlas: {
            default: null,
            type: cc.SpriteAtlas
        },

        _index: 0,
        _interval: 1,

        _next: 0,
    },

    onLoad: function() {
        let atlas = this.atlas;
        if (!atlas)
            return;
    },

    onEnable: function() {
        
    },

    update: function(dt) {
        let node = this.node;
        let sp = node.getComponent(cc.Sprite);
        let atlas = this.atlas;
        let interval = this._interval;

        if (!node.active || !sp || !atlas)
            return;

        this._next += dt;
        console.log('dt=' + dt);
        if (this._next < interval)
            return;

        this.next -= interval;

        let sprites = atlas.getSpriteFrames();
        let total = sprites.length;

        this._index = (this._index + 1) % total;
        sp.spriteFrame = sprites[this._index];
    }
});

