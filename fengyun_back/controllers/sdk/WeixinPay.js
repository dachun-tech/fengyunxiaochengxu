let config = require('../../config')();
let fs = require('fs');
let Payment = require('wechat-pay').Payment;

let initConfig = {
    partnerKey: config.app.secret,
    appId: config.app.id,
    mchId: config.app.mchID,
    notifyUrl: config.app.notifyUrl,
    pfx: fs.readFileSync( __dirname + '/' + config.app.cert_location),
};
module.exports.initConfig = initConfig;
module.exports.payment = function() {
    return new Payment(initConfig);
};
