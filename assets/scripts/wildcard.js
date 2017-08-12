
var g_NeedHunCount = 4;

function min(a, b) {
	return a < b ? a : b;
}

function getType(mj) {
	return parseInt(mj / 10);
}

function sortArr(arr) {
	if (arr.length == 0) {
		return;
	}

	arr.sort(function(a, b) {
		return a - b;
	});
}

function seprateArr(mjArr, hunMj) {
	var reArr = [[],[],[],[],[]];
	var ht = getType(hunMj);
	var hv = hunMj % 10;
	for (var i in mjArr) {
		var mj = mjArr[i];
		var t = getType(mj);
		var v = mj % 10;
		if (ht == t && hv == v) {
			t = 0;
		}

		reArr[t].push(mj);
		sortArr(reArr[t]);
	}

	return reArr;
}

function test3Combine(mj1, mj2, mj3) {
	var t1 = getType(mj1);
	var t2 = getType(mj2);
	var t3 = getType(mj3);
	if (t1 != t2 || t1 != t3) {
		return false;
	}

	var v1 = mj1 % 10;
	var v2 = mj2 % 10;
	var v3 = mj3 % 10;

	if (v1 == v2 && v1 == v3) {
		return true;
	}

	if (t3 == 4) {
		return false;
	}

	if ((v1+1) == v2 && (v1+2) == v3) {
		return true;
	}

	return false;
}

function getModNeedNum(arrLen, isJiang) {
	if (arrLen <=0) {
		return 0;
	}

	var modNum = arrLen % 3;
	var needNumArr = isJiang ? [ 2, 1, 0 ] : [ 0, 2, 1 ];

	return needNumArr[modNum];
}

function getNeedHunInSub(subArr, hNum) {
	if (g_NeedHunCount == 0) {
		return;
	}

	var lArr = subArr.length;

	if (hNum + getModNeedNum(lArr, false) >= g_NeedHunCount) {
		return;
	}

	if (lArr == 0) {
		g_NeedHunCount = min(hNum, g_NeedHunCount);
		return;
	} else if (lArr == 1) {
		g_NeedHunCount = min(hNum + 2, g_NeedHunCount);
		return;
	} else if (lArr == 2) {
		var t = getType(subArr[0]);
		var v0 = subArr[0] % 10;
		var v1 = subArr[1] % 10;
		if (t == 4) {
			if (v0 == v1) {
				g_NeedHunCount = min(hNum + 1, g_NeedHunCount);
				return;
			}
		} else if ((v1-v0) < 3) {
			g_NeedHunCount = min(hNum + 1, g_NeedHunCount);
		}

		return;
	} else if (lArr >= 3) {
		var t  = getType(subArr[0]);
		var v0 = subArr[0] % 10;
		var v2 = subArr[2] % 10;

		var arrLen = subArr.length;
		for (var i = 1; i < arrLen; i++) {
			if (hNum + getModNeedNum(lArr - 3, false)  >= g_NeedHunCount) {
				break;
			}

			var v1 = subArr[i] % 10;
			if (v1 - v0 > 1) {
				break;
			}

			if ((i + 2)  < arrLen) {
				if (subArr[i + 2]%10 == v1) {
					continue;
				}
			}

			if (i + 1 < arrLen) {
				var tmp1 = subArr[0];
				var tmp2 = subArr[i];
				var tmp3 = subArr[i+1];
				if (test3Combine(tmp1, tmp2, tmp3)) {
					subArr.splice(i+1, 1);
					subArr.splice(i, 1);
					subArr.splice(0, 1);
					var subLen = subArr.length;
					getNeedHunInSub(subArr, hNum);
					subArr.push(tmp1);
					subArr.push(tmp2);
					subArr.push(tmp3);
					sortArr(subArr);
				}
			}
		}

		var v1 = subArr[1] % 10;
		if (hNum + getModNeedNum(lArr - 2, false) + 1 < g_NeedHunCount) {
			if (t == 4) {
				if (v0 == v1) {
					var tmp1 = subArr[0];
					var tmp2 = subArr[1];
					subArr.splice(1, 1);
					subArr.splice(0, 1);
					getNeedHunInSub(subArr, hNum + 1);
					subArr.push(tmp1);
					subArr.push(tmp2);
					sortArr(subArr);
				}
			} else {
				var arrLen= subArr.length;
				for (var i = 1; i < arrLen; i++) {
					if (hNum + getModNeedNum(lArr-2, false) +1  >= g_NeedHunCount) {
						break;
					}

					var v1 = subArr[i] % 10;
					if ((i+1) != arrLen) {
						v2 = subArr[i+1] % 10;
						if (v1 == v2) {
							continue
						}
					}

					var mius = v1 - v0;
					if  (mius < 3) {
						var tmp1 = subArr[0];
						var tmp2 = subArr[i];
						subArr.splice(i, 1);
						subArr.splice(0, 1);
						getNeedHunInSub(subArr, hNum+1);
						subArr.push(tmp1);
						subArr.push(tmp2);
						sortArr(subArr);
						if (mius >= 1) {
							break;
						}
					} else {
						break;
					}
				}
			}
		}

		if (hNum + getModNeedNum(lArr-1, false) + 2 < g_NeedHunCount) {
			var tmp = subArr[0];
			subArr.splice(0, 1);
			getNeedHunInSub(subArr, hNum+2);
			subArr.push(tmp);
			sortArr(subArr);
		}
	} else {
		return;
	}
}

function test2Combine(mj1, mj2) {
	return (getType(mj1) == getType(mj2)) && (mj1 % 10 == mj2 % 10);
}

function unique(arr) {
	var n = [];

	for (var i = 0; i < arr.length; i++) {
		var t = arr[i];
		if (n.indexOf(t) == -1) {
			n.push(t);
		}
	}

	return n;
}

function canHu(hunNum, arr) {
	var tmpArr = arr.slice(0);
	var arrLen  = tmpArr.length;
	if (arrLen <= 0) {
		if (hunNum >= 2) {
			return true;
		}

		return false;
	}

	if (hunNum < getModNeedNum(arrLen, true)) {
		return false;
	}

	for (var i = 0; i < arrLen; i++) {
		if (i == (arrLen - 1 )) {
			if (hunNum > 0) {
				var tmp = tmpArr[i];
				hunNum = hunNum - 1;
				tmpArr.splice(i, 1);
				g_NeedHunCount = 4;
				getNeedHunInSub(tmpArr, 0);
				if (g_NeedHunCount <= hunNum) {
					return true;
				}
				hunNum = hunNum + 1;
				tmpArr.push(tmp);
				sortArr(tmpArr);
			}
		} else {
			if (i + 2 == arrLen || (tmpArr[i]%10) != (tmpArr[i+2]%10)) {
				if (test2Combine(tmpArr[i], tmpArr[i+1])) {
					var tmp1 = tmpArr[i];
					var tmp2 = tmpArr[i+1];
					tmpArr.splice(i + 1, 1);
					tmpArr.splice(i, 1);
					g_NeedHunCount = 4;
					getNeedHunInSub(tmpArr, 0);
					if (g_NeedHunCount <= hunNum) {
						return true;
					}
					tmpArr.push(tmp1);
					tmpArr.push(tmp2);
					sortArr(tmpArr);
				}
			}

			if (hunNum > 0 && (tmpArr[i]%10) != (tmpArr[i+1]%10)) {
				hunNum = hunNum - 1;
				var tmp = tmpArr[i];
				tmpArr.splice(i, 1);
				g_NeedHunCount = 4;
				getNeedHunInSub(tmpArr, 0);
				if (g_NeedHunCount <= hunNum) {
					return true;
				}
				hunNum = hunNum + 1;
				tmpArr.push(tmp);
				sortArr(tmpArr);
			}
		}
	}

	return false;
}

function testHu(mj, mjArr, hunMj) {
	var tmpArr = mjArr.slice(0);
	if (mj != 0) {
		tmpArr.push(mj);
	}

	var sptArr = seprateArr(tmpArr, hunMj);
	var curHunNum = sptArr[0].length;
	if (curHunNum > 3) {
		return true;
	}

	var ndHunArr = [];
	for (var i = 1; i < 5; i++) {
		g_NeedHunCount = 4
		getNeedHunInSub(sptArr[i], 0);
		ndHunArr.push(g_NeedHunCount);
	}

	var isHu = false;
	var hasNum = 0;

	var ndHunAll = ndHunArr[1] + ndHunArr[2] + ndHunArr[3];
	if (ndHunAll <= curHunNum) {
		hasNum = curHunNum - ndHunAll;
		isHu = canHu(hasNum, sptArr[1]);

		if (isHu) {
			return true;
		}
	}

	ndHunAll = ndHunArr[0] + ndHunArr[2] + ndHunArr[3];
	if (ndHunAll <= curHunNum) {
		hasNum = curHunNum - ndHunAll;
		isHu = canHu(hasNum, sptArr[2]);
		if (isHu) {
			return true;
		}
	}

	ndHunAll = ndHunArr[0] + ndHunArr[1] + ndHunArr[3];
	if (ndHunAll <= curHunNum) {
		hasNum = curHunNum - ndHunAll;
		isHu = canHu(hasNum, sptArr[3]);
		if (isHu) {
			return true;
		}
	}

	ndHunAll = ndHunArr[0] + ndHunArr[1] + ndHunArr[2];
	if (ndHunAll <= curHunNum) {
		hasNum = curHunNum - ndHunAll;
		isHu = canHu(hasNum, sptArr[4]);
		if (isHu) {
			return true;
		}
	}

	return false;
}

function testAllHu(mjArr, hunMj) {
	var tmpArr = mjArr.slice(0);

	var sptArr = seprateArr(tmpArr, hunMj);
	var curHunNum = sptArr[0].length;
	if (curHunNum > 3) {
		return true;
	}

	var ndHunAll = 0;

	for (var i = 1; i < 5; i++) {
		g_NeedHunCount = 4
		getNeedHunInSub(sptArr[i], 0);
		ndHunAll += g_NeedHunCount;
	}

	return ndHunAll + 1 == curHunNum;
}

function getJiangNeedHum(arr) {
	var minNeedNum = 4
	var tmpArr = arr.slice(0);
	var arrLen  = tmpArr.length;

	if (arrLen <= 0) {
		return 2;
	}

	for (var i = 0; i < arrLen; i++) {
		if (i == (arrLen - 1 )) {
			var tmp = tmpArr[i]

			tmpArr.splice(i, 1);
			g_NeedHunCount = 4;
			getNeedHunInSub(tmpArr, 0);
			minNeedNum = min(minNeedNum, g_NeedHunCount+1);
			tmpArr.push(tmp);
			sortArr(tmpArr);
		} else {
			if (i + 2 == arrLen || (tmpArr[i]%10) != (tmpArr[i+2]%10)) {
				if (test2Combine( tmpArr[i], tmpArr[i+1] )) {
					var tmp1 = tmpArr[i];
					var tmp2 = tmpArr[i+1];
					tmpArr.splice(i + 1, 1);
					tmpArr.splice(i, 1);
					g_NeedHunCount = 4;
					getNeedHunInSub(tmpArr, 0);

					minNeedNum = min(minNeedNum,g_NeedHunCount);

					tmpArr.push(tmp1);
					tmpArr.push(tmp2);
					sortArr(tmpArr);
				}
			}

			if ((tmpArr[i]%10) != (tmpArr[i+1]%10)) {
				tmp = tmpArr[i];
				tmpArr.splice(i, 1);
				g_NeedHunCount = 4;
				getNeedHunInSub(tmpArr, 0);
				
				minNeedNum = min(minNeedNum,g_NeedHunCount+1);
				
				tmpArr.push(tmp);
				sortArr(tmpArr);
			}
		}
	}

	return minNeedNum;
}

function getLackNum(sd) {
        var len = sd.pengs.length + sd.angangs.length + sd.wangangs.length + sd.diangangs.length;

        if (sd.chis)
			len += sd.chis.length;

        len *= 3;

        return len;
}

cc.Class({
    extends: cc.Component,

    properties: {

    },

	onLoad: function() {
		if (cc.vv == null)
			return;

		cc.vv.wildcard = this;
    },

	getLeft: function(pai) {
		var seats = cc.vv.gameNetMgr.seats;
		var left = 4;

		for (var i in seats) {
			var seat = seats[i];
			var holds = seat.holds;
			var folds = seat.folds;

			if (holds && holds.length > 0) {
				for (var j in holds) {
					if (holds[j] == pai) {
						left -= 1;
					}
				}
			}

			if (folds && folds.length > 0) {
				for (var j in folds) {
					if (folds[j] == pai) {
						left -= 1;
					}
				}
			}

			seat.chis.forEach(function(x) {
				var mjs = cc.vv.gameNetMgr.getChiArr(x);

				if (mjs.indexOf(pai) >= 0)
					left -= 1;
			});

			seat.pengs.forEach(function(x) {
				if (x % 100 == pai)
					left -= 3;
			});

			seat.angangs.forEach(function(x) {
				if (x % 100 == pai)
					left -= 4;
			});

			seat.diangangs.forEach(function(x) {
				if (x % 100 == pai)
					left -= 4;
			});

			seat.wangangs.forEach(function(x) {
				if (x % 100 == pai)
					left -= 4;
			});
		}

		return left;
    },

	getNormalTings: function(mjArr, hunMj) {
		var tmpArr = mjArr.slice(0);
		var sptArr = seprateArr(tmpArr, hunMj);

		var ndHunArr = [];
		for (var i = 1; i < 5; i++) {
			g_NeedHunCount = 4;
			getNeedHunInSub(sptArr[i], 0);
			ndHunArr.push(g_NeedHunCount);
		}

		var jaNdHunArr = [];
		for (var i = 1; i < 5; i++) {
			var jdNeedHunNum = getJiangNeedHum(sptArr[i]);
			jaNdHunArr.push(jdNeedHunNum);
		}

		var curHunNum = sptArr[0].length;
		var tingArr = [];
		var paiArr = [[11, 20],[21,30],[31,40],[41,48]];

		var isAllHu = false;
		var needNum = 0;

		for (var i = 0; i < 4; i++) {
			needNum += ndHunArr[i];
		}

		if (curHunNum - needNum == 1) {
			isAllHu = true;
		}

		if (isAllHu) {
			for (var i in paiArr) {
				var lis = paiArr[i];
				for (var x = lis[0]; x < lis[1]; x++) {
					tingArr.push(x);
				}
			}

			return  tingArr;
		}

		for (var i = 0; i < 4; i++) {
			needNum = 0;

			for (var j = 0; j < 4; j++) {
				if (i != j) {
					needNum = needNum + ndHunArr[j];
				}
			}

			if (needNum <= curHunNum) {
				for (var k = paiArr[i][0]; k < paiArr[i][1]; k++) {
					var t = sptArr[i+1].concat([ k ]);
					
					sortArr(t);
					if (canHu(curHunNum - needNum, t)) {
						tingArr.push(k);
					}
				}
			}

			for (var j = 0; j < 4; j++) {
				if (i != j) {
					needNum = 0
					for (var k = 0; k  < 4; k++) {
						if (k != i) {
							if (k == j) {
								needNum += jaNdHunArr[k];
							} else {
								needNum += ndHunArr[k];
							}
						}
					}

					if (needNum <= curHunNum) {
						for (var k = paiArr[i][0]; k < paiArr[i][1]; k++) {
							if (tingArr.indexOf(k) == -1) {
								var t =  sptArr[i+1].concat([ k ]);
								g_NeedHunCount = 4
								sortArr(t);
								getNeedHunInSub(t, 0);
								if (g_NeedHunCount <= curHunNum - needNum) {
									tingArr.push(k);
								}
							}
						}
					}
				}
			}
		}

		if (tingArr.length > 0 && tingArr.indexOf(hunMj) == -1 && hunMj > 0) {
			tingArr.push(hunMj);
		}

		return tingArr;
	},

	getAPTings: function(holds) {
		var cntmap = {};
		var max = 7;

		for (var i = 0; i < holds.length; i++) {
			var pai = holds[i];
			if (cntmap[pai] == null)
				cntmap[pai] = 1;
			else
				cntmap[pai] += 1;
		}

		var pairs = 0;
		var danPai = [];

		for (var key in cntmap) {
			var pai = parseInt(key);
			var c = cntmap[key];
			if (c == 2 || c == 3) {
				pairs++;
			} else if (c == 4) {
				pairs += 2;
			}

			if (c == 1 || c == 3) {
				danPai.push(pai);
			}
		}

		console.log('pairs=' + pairs);

		if (pairs == max - 1)
			return danPai;

		return [];
	},

	getTings: function(sd, outcard) {
		var holds = sd.holds.slice(0);
		var idx = holds.indexOf(outcard);
		var tingmap = {};
		var self = this;

		holds.splice(idx, 1);

		var addTing = function(pai, allpairs) {
			if (tingmap[pai] == null) {
				tingmap[pai] = {
					pai: pai,
					left: self.getLeft(pai),
					pattern: allpairs ? '七对' : '平胡'
				};
			}
		};

		if (holds.length >= 13) {
			var ap = this.getAPTings(holds);

			console.log('ap');
			console.log(ap);

			if (ap.length > 0) {
				for (var i = 0; i < ap.length; i++) {
					addTing(ap[i], true);
				}
			}
		}

		var normal = this.getNormalTings(holds, -1);

		if (normal.length > 0) {
			for (var i = 0; i < normal.length; i++) {
				addTing(normal[i], false);
			}
		}

		var tings = [];

		for (var key in tingmap) {
			tings.push(tingmap[key]);
		}

		return tings;
	},
});

