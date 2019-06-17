const app = getApp();

Page({
    data: {
        typeStr: ['', '正在处理', '提现成功', '提现失败']
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

        var that = this;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getWithdraws,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: { user_id: app.globalData.userInfo.user_id },
            success: function(res) {

                var ret = res.data.result;

                if (res.data.status == 'success') {

                    for (var i = 0; i < ret.length; i++) {
                        var item = ret[i];
                        var newsTime = item.created_at;
                        newsTime = newsTime.replace(/T/g, ' ');
                        // newsTime = newsTime.replace(/-/g, '/');
                        newsTime = newsTime.split('.')[0];
                        // var tempdate = Date.parse(newsTime);

                        // console.log(now - tempdate);

                        // if (now - tempdate < 120000) {
                        //     item.submit_time = "刚刚"
                        // } else if (now - tempdate < 3600000) {
                        //     var minute = (now - tempdate) / 60000
                        //     minute = Math.floor(minute)
                        //     item.submit_time = minute + "分钟前"
                        // } else if (now - tempdate < 86400000) {
                        //     var hour = (now - tempdate) / 3600000
                        //     hour = Math.floor(hour)
                        //     item.submit_time = hour + "小时前"
                        // } else if (now - tempdate < 172800000) {
                        //     item.submit_time = "昨天"
                        // } else {
                        //     item.submit_time = newsTime
                        // }
                        item.submit_time = newsTime
                        item.price = (parseFloat(item.amount)).toFixed(2);
                        item.realPrice = (parseFloat(item.amount * .98)).toFixed(2);
                        item.type = item.w_state;
                    }
                    that.setData({ allItems: ret })

                } else {
                    app.popup_alert(res.data.message);
                }

            },
            complete: function() { wx.hideLoading(); }
        })
    },
});