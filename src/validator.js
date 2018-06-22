var CN_MOBIIE_REGEXP = /^(\+?0?86-?)?1[3456789]\d{9}$/
var FIXED_TEL_REGEXP = /^(0[0-9]{2,3}-)?([1-9][0-9]{6,7})+(-[0-9]{1,4})?$/

export function cnmobileCheck(value) {
    return CN_MOBIIE_REGEXP.test(value)
}

export function cnnameCheck(value) {
    return /^[*\u4E00-\u9FA5]{1,8}(?:[·•]{1}[\u4E00-\u9FA5]{2,10})*$/.test(
        value
    )
}

export function fixedtelCheck(value) {
    return FIXED_TEL_REGEXP.test(value)
}
// added verfication of bankcard http://blog.csdn.net/mytianhe/article/details/18256925
export function bankcardCheck(cardNo) {
    cardNo = ('' + cardNo).replace(/\s/gi, '')
    var len = cardNo.length
    if (!/\d+/.test(cardNo) || len < 9) {
        return false
    }
    cardNo = cardNo.split('')
    var checkCode = parseInt(cardNo[len - 1])
    var sum = 0
    for (var i = len - 2, j = 0; i >= 0; i--, j++) {
        var it = parseInt(cardNo[i])
        if (j % 2 === 0) {
            it *= 2
            it = parseInt(it / 10) + parseInt(it % 10)
        }
        sum += parseInt(it)
    }

    if ((sum + checkCode) % 10 === 0) {
        return true
    } else {
        return false
    }
}

export function idCardCheck(val) {
    if (/^\d{17}[0-9xX]$/.test(val)) {
        var vs = '1,0,x,9,8,7,6,5,4,3,2'.split(',')
        var ps = '7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2'.split(',')
        var ss = val.toLowerCase().split('')
        var r = 0
        for (var i = 0; i < 17; i++) {
            r += ps[i] * ss[i]
        }
        return vs[r % 11] === ss[17]
    }
}

export function passwordCheck(password) {
    password = password + ''
    return password.length > 6 && /\d+/.test(password) && /[a-z]+/.test(password)
}

export function smsCodeCheck(value) {
    return /[0-9]{4,6}/.test(value)
}
