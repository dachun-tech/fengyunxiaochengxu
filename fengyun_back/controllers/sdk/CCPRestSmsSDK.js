let request = require('request');
let md5 = require('md5');
const internal = {};
module.exports = internal.CCPRestSmsSDK = class {
    constructor(ServerIP, ServerPort, SoftVersion) {
        this.Batch = new Date();
        this.ServerIP = ServerIP;
        this.ServerPort = ServerPort;
        this.SoftVersion = SoftVersion;
    }

    setAccount(AccountSid, AccountToken) {
        this.AccountSid = AccountSid;
        this.AccountToken = AccountToken;
    }

    setAppId(AppId) {
        this.AppId = AppId;
    }

    async curl_post(url, data, header) {
        let postRes = await this.request_post(url, data, header);
        console.log(postRes);
        if (!postRes) {
            postRes = {
                statusCode: 172001,
                statusMsg: '网络错误'
            };
        }
        return postRes;
    }

    async sendTemplateSMS(to, datas, tempId) {
        //主帐号鉴权信息验证，对必选参数进行判空。
        let auth = this.accAuth();
        if (auth !== "") return auth;
        // 拼接请求包体
        let data = "";
        for (let i = 0; i < datas.length; i++) {
            data += "'" + datas[i] + "',";
        }
        let body = {
            to: to,
            templateId: tempId,
            appId: this.AppId,
            datas: [data]
        };
        console.log("body: ", body);
        let sig = md5(this.AccountSid + this.AccountToken + this.Batch);
        let url = "https://" + this.ServerIP + ":" + this.ServerPort + "/" + this.SoftVersion + "/Accounts/" + this.AccountSid + "/SMS/TemplateSMS?sig=" + sig;
        console.log("sig url: ", url);
        let authen = btoa(this.AccountSid + ":" + this.Batch);
        let header = {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': authen
        };
        let res = await this.curl_post(url, body, header);
        console.log('curl post result: ', res);
        let resDatas = atob(res);
        if (resDatas.statusCode === 0) {
            resDatas.TemplateSMS = resDatas.templateSMS;
            delete resDatas.templateSMS;
        }
        return resDatas;
    }

    accAuth() {
        if (this.ServerIP === "") return {statusCode: '172004', statusMsg: 'IP为空'};
        if (this.ServerPort < 0) return {statusCode: '172005', statusMsg: '端口错误（小于等于0）'};
        if (this.SoftVersion === "") return {statusCode: '172013', statusMsg: '版本号为空'};
        if (this.AccountSid === "") return {statusCode: '172006', statusMsg: '主帐号为空'};
        if (this.AccountToken === "") return {statusCode: '172007', statusMsg: '主帐号令牌为空'};
        if (this.AppId === "") return {statusCode: '172012', statusMsg: '应用ID为空'};
        return "";
    }

    request_post(url, data, header) {
        console.log("request to sms server...");
        let options = {
            url: url,
            method: 'POST',
            json: data,
            header: header
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (err) reject(err);
                try {
                    resolve(body)
                } catch (e) {
                    reject(e)
                }
            })
        })
    }
}