
cc.Class({
    extends: cc.Component,

    properties: {
        _temp : null
    },

    onLoad: function () {
        var top = this.node.getChildByName('top');
        var btn_back = top.getChildByName('btn_back');
        var addClickEvent = cc.vv.utils.addClickEvent;

		addClickEvent(btn_back, this.node, 'Shop', 'onBtnCloseClicked');

        var content = cc.find('items/view/content', this.node);
        var item = content.children[0];

        addClickEvent(item, this.node, 'Shop', 'onBtnGoodsClicked');

        this._temp = item;
        content.removeChild(item, false);
    },

    onEnable: function() {
        this.refresh();
    },

    getItem: function(index) {
		var content = cc.find('items/view/content', this.node);

        if (content.childrenCount > index) {
            return content.children[index];
        }

        var node = cc.instantiate(this._temp);

        content.addChild(node);
        return node;
    },

	shrinkContent: function(content, num) {
        while (content.childrenCount > num) {
            var lastOne = content.children[content.childrenCount -1];
            content.removeChild(lastOne);
        }
    },

    showGoods: function(goods) {
		var content = cc.find('items/view/content', this.node);

		for (var i = 0; i < goods.length; i++) {
			var good = goods[i];
			var item = this.getItem(i);
            var price = cc.find('btn_buy/price', item).getComponent(cc.Label);
            var title = item.getChildByName('title').getComponent(cc.Label);

            price.string = '' + (good.price / 100);
            title.string = good.quantity + '';

            item.good = good;
		}

		this.shrinkContent(content, goods.length);
    },

    refresh: function() {
        var self = this;

        var data = {
			currency: 'RMB',
		};

        cc.vv.pclient.request_apis('list_goods_from_shop', data, ret=>{
            if (ret.errcode != 0) {
                cc.vv.alert.show(ret.errmsg);
                return;
            }

            self.showGoods(ret.data);
        });
    },

	onBtnGoodsClicked: function(event) {
		console.log('onBtnGoodsClicked');

		var good = event.target.good;

		cc.vv.anysdkMgr.pay(cc.vv.userMgr.sign, info.id);
		return;
    },

	onBtnCloseClicked: function() {
		cc.vv.audioMgr.playButtonClicked();
	    cc.vv.utils.showDialog(this.node, 'body', false); 
    },
});

