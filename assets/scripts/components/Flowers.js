
cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function() {
        this.hideAllFlowers();

        var self = this;

        this.node.on('user_hf_updated', data=>{
            console.log('user_hf_updated');
            self.updateFlowers(data.detail);
        });
    },

    getFlowersByLocalID: function(id) {
        let flowers = [ 'game/south/flowers',
                        'perspective/right_flowers',
                        'game/north/flowers',
                        'perspective/left_flowers' ];

        return cc.find(flowers[id], this.node);
    },

    hideAllFlowers: function() {
        for (let i = 0; i < 4; i++) {
            let flowers = this.getFlowersByLocalID(i);
            flowers.active = false;
        }
    },

    updateFlowers: function(sd) {
		let net = cc.vv.gameNetMgr;
		let seats = sd ? [ sd ] : net.seats;
		let cards = [ 45, 46, 47, 51, 52, 53, 54, 55, 56, 57, 58 ];

		console.log('updateFlowers');

		for (let i = 0; i < seats.length; i++) {
			var seat = seats[i];
			if (!seat || seat.flowers == null)
				continue;

			let seatindex = net.getSeatIndexByID(seat.userid);
			let local = net.getLocalIndex(seatindex);
			let flowers = this.getFlowersByLocalID(local);
			let index = 0;

			console.log('seat ' + i + ' flowers ' + seat.flowers.length);
			flowers.active = seat.flowers.length > 0;

			if (seat.flowers.length == 0)
				continue;

			let fls = {};
            seat.flowers.forEach(x=>{
                fls[x] = (fls[x] == null) ? 1 : fls[x] + 1;
            });

			for (let key in fls) {
				let pai = parseInt(key);
				let off = cards.indexOf(pai);
				if (off == -1) {
					console.log('card not found ' + pai);
					continue;
				}

				let item = flowers.children[index];
				let text = item.getChildByName('text').getComponent('SpriteMgr');
				let num = item.getChildByName('num').getComponent(cc.Label);

				text.setIndex(off);
				num.string = fls[key];
                item.active = true;

				index++;
			}

            for (let j = index; j < flowers.childrenCount; j++) {
                let item = flowers.children[index];
                item.active = false;

                index++;
            }
		}
    },
});

