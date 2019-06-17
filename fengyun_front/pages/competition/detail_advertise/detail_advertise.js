//index.js
//获取应用实例

var WxParse = require('../../../wxParse/wxParse.js');
const app = getApp();

Page({
    data: {
        serverImageRoot: app.globalData.imageRootURL,
        is3IconExist: 0, // -1: no button, 0: 2 buttons, 1: 3 buttons
        options: {},
        allItems: {}
    },
    onLoad: function(option) {
        this.data.options = option;
    },
    getUserModalHide: function() {
        this.setData({
            getUserInfoDisabled: false
        });
        wx.showTabBar({});
        this.onShow();
    },
    onShow: function(option) {
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
        var option = that.data.options;
        that.data.allItems.ad_id = option.id;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getAdDetail,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                ad_id: that.data.allItems.ad_id
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var ret = res.data.result;
                    var itemInfo = that.data.allItems;

                    itemInfo.ad_title = ret.ad_title;
                    itemInfo.ad_poster_name = ret.ad_poster_name;
                    itemInfo.ad_post_time = ret.ad_post_time;
                    itemInfo.ad_read_count = ret.ad_read_count;

                    var adTime = ret.ad_post_time;
                    adTime = adTime.replace(/T/g, ' ');
                    adTime = adTime.split('.')[0];
                    adTime = adTime.replace(/-/g, '.');
                    itemInfo.ad_post_time = adTime;

                    itemInfo.ad_intro = ret.ad_intro;
                    WxParse.wxParse('ad_intro', 'html', JSON.parse(ret.ad_intro), that);

                    that.setData({ allItems: that.data.allItems });

                } else app.popup_alert(res.data.message);
            },
            complete: function() { wx.hideLoading(); }
        });
    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: that.data.allItems.ad_title + '!',
            path: '/pages/competition/detail_advertise/detail_advertise',
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});