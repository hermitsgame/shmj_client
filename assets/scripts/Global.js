var Global = cc.Class({
    extends: cc.Component,
    statics: {
        isstarted:false,
        netinited:false,
        userguid:0,
        nickname:"",
        money:0,
        lv:0,
        roomId:0,
        const_code : {
            OK: 0,
            FAIL: 500,

            NOT_ENOUGH_GEMS : 2222,
            CAN_NOT_FIND_ROOM : 2223,
            ROOM_IS_FULL : 2224,
            ROOM_NOT_EXIST : 2225,
            NOT_ENOUGH_WHEEL : 2226,
            NOT_ENOUGH_LOTTERY : 2227,
            NOT_ENOUGH_GEM : 2228,
            NOT_ENOUGH_ACTIVE : 2229,
            NOT_ENOUGH_GOLD : 2230,
            ALREADY_SIGN : 2231,

            ENTRY: {
                FA_TOKEN_INVALID: 	1001,
                FA_TOKEN_EXPIRE: 	1002,
                FA_USER_NOT_EXIST: 	1003
            },

            GATE: {
                FA_NO_SERVER_AVAILABLE: 2001
            },

            ORDER : {
                ORDER_SUCCESS: 3100,
                ORDER_NOT_PAY : 3101,
                ORDER_ALREADY_GOT : 3102,
                ORDER_NOT_EXIST: 3103
            },
        }
    },
});