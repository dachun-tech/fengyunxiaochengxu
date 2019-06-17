let fs = require('fs');
let path = require('path');
let config = {
    isLocal: false,
    baseAPIURL: 'https://fengquba.cn',
    baseSiteURL: 'https://fengquba.cn',
    baseAPIURL_L: 'https://fengquba.cn',
    baseSiteURL_L: 'https://fengquba.cn',
    port: 3003,
    api_port: 3000,
    cron_port: 3001,
    mongo: {
        port: 27017,
        dbname:'fengyun'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379
    },
    app: {
        id: 'wx772b3b3ff5817bdc',
        secret: '614253f6dfe5ad9d89bbad760dc0bdde',
        mchID: '1529374141',
        notifyUrl: 'api/weixin-notify',
        cert_location: 'apiclient_cert.p12',
        partnerKey: '614253f6dfe5ad9d89bbad760dc0bdde',
    },
    wechat_config: {
        partnerKey: '18846140810joey18846140510joey18',
        appId: 'wx772b3b3ff5817bdc',
        mchId: '1529374141',
        notifyUrl: 'https://fengquba.cn/api/weixin-notify',
        pfx: fs.readFileSync(path.dirname(require.main.filename) + '/apiclient_cert.p12')
    },
    payment_config: {
        appid: 'wx772b3b3ff5817bdc',
        mchid : '1529374141',
        partnerKey : '18846140810joey18846140510joey18',
        pfx:fs.readFileSync(path.dirname(require.main.filename) + '/apiclient_cert.p12'),
        notify_url: 'https://fengquba.cn/api/weixin-notify',
        spbill_create_ip: '39.107.226.107',
    }
};
if(config.isLocal) {
    config.baseAPIURL = config.baseAPIURL_L;
    config.baseSiteURL = config.baseSiteURL_L;
}
module.exports = function() {
    return config;
};