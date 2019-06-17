const app = getApp();

Page({
    data: {
        identify_nickname: '',
        identify_name: '',
        identify_phone: '',
        identify_code: '',
        sms_state: 0,
        sms_button_text: ['获取验证码', 's后重发'],
        sms_count_state: 1,
        second_count: 60,
        check_code: 0,
        _tmr: 0,
        isProcessing: false,
    },
    onLoad: function() {},
    getUserModalHide: function() {
        this.setData({
            getUserInfoDisabled: false
        });
        wx.showTabBar({});
        this.onShow();
    },
    onShow: function(option) {
        this.onPrepare();
        return;
        let that = app;
        let _this = this;
        that.globalData.initDisabled = false;
        wx.getSetting({
            success: function(res) {
                // console.log("index getSetting ... ", res);
                let perm = res;
                that.globalData.getUserInfoDisabled = !perm.authSetting['scope.userInfo'];
                that.globalData.getUserLocationDisabled = !perm.authSetting['scope.userLocation'];
                if (!that.globalData.getUserInfoDisabled && !that.globalData.getUserLocationDisabled) {
                    _this.onPrepare();
                    return;
                }
                if (perm.authSetting['scope.userInfo'] !== true && that.globalData.initDisabled === false) {
                    that.globalData.initDisabled = true;
                    _this.setData({
                        getUserInfoDisabled: true
                    });
                    wx.hideTabBar({})
                } else {
                    // console.log("authorization ...");
                    wx.authorize({
                        scope: 'scope.userLocation',
                        fail: function() {
                            that.globalData.initDisabled = true;
                        },
                        complete: function() {
                            if (that.globalData.initDisabled)
                                that.go2Setting();
                            else {
                                that.globalData.getUserInfoDisabled = false;
                                _this.onPrepare();
                                app.globalData.isFirstLaunch = false;
                            }
                        }
                    });
                }
            }
        });
    },
    onPrepare: function() {
        let that = this;
        app.showLoading();
        let option = that.data.options;
        if (app.globalData.userInfo.nickname === '')
            app.onInitialize(function() {
                that.onInitStart(option);
            });
        else
            that.onInitStart(option);

    },
    onInitStart: function() {
        wx.hideLoading();
        this.setData({
            userInfo: app.globalData.userInfo,
            identify_nickname: app.globalData.userInfo.nickname
        });
        // console.log("start identify input page");
    },
    onInputIdentify: function(e) {
        var that = this;
        let type = e.target.dataset.type;
        let val = e.detail.value;
        switch (type) {
            case 'name':
                this.setData({
                    identify_name: val
                });
                break;
            case 'phone':
                let isnum = /^\d+$/.test(val);
                if (isnum)
                    this.setData({
                        identify_phone: val
                    });
                else
                    this.setData({
                        identify_phone: val.substr(0, val.length - 1)
                    });
                break;
            case 'code':
                this.setData({
                    identify_code: val
                });
                break;
            default:
                break;
        }
    },
    send_sms: function() {
        var that = this;
        if (that.data.sms_state == 1) return;

        if (!app.checkValidPhone(this.data.identify_phone)) {
            app.popup_modal('请输入真的手机号');
            return;
        }

        var random = Math.ceil(Math.random() * 900000) + 100000;
        wx.request({
            url: app.globalData.smsApiURL,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                'phonenumber': this.data.identify_phone,
                'random': random
            },
            success: function(res) {
                if (res.data.result == "success") {
                    clearInterval(that.data._tmr);
                    that.data._tmr = setInterval(function() {
                        that.setData({
                            second_count: (that.data.second_count - 1)
                        })
                        if (that.data.second_count == 0) {
                            that.setData({
                                second_count: 60,
                                sms_state: 0
                            })
                            clearInterval(that.data._tmr);
                        }
                    }, 1000)
                    app.popup_notify('短信发送成功');
                    that.setData({
                        sms_state: 1,
                        check_code: random
                    })
                } else {
                    app.popup_alert('无法发送短信: ' + JSON.stringify(res.data.error));
                }
            },
            fail: function(res) {
                app.popup_alert('无法发送短信: ' + JSON.stringify(res.data.error));
            },
            complete: function(res) {

            }
        });
    },
    submit_identify: function() {
        var that = this;
        // console.log(this.data.identify_nickname, this.data.identify_name, this.data.identify_phone);
        let err = '';
        if (that.data.identify_code != that.data.check_code) err = '授权码';
        if (!app.checkValidPhone(this.data.identify_phone)) err = '手机号';
        if (this.data.identify_name === '') err = '名称';
        if (err !== '') {
            app.popup_modal('请输入真的' + err);
            return;
        }
        clearInterval(that.data._tmr);
        app.globalData.userInfo.name = this.data.identify_name;
        app.globalData.userInfo.phone = this.data.identify_phone;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.addOrganizer,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                nickname: this.data.identify_nickname,
                name: this.data.identify_name,
                phone: this.data.identify_phone
            },
            success: function(res) {
                if (res.data.status === 'success') wx.navigateTo({ url: 'identify_result' });
                else app.popup_modal(res.data.message);
            }
        });

    }
});