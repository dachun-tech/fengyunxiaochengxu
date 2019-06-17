//index.js
//获取应用实例
const app = getApp();

Page({
    data: {
        serverImageRoot: app.globalData.imageRootURL,
        isAuthorized: false,

        curCityId: 0,
        cityArr: ["全国"],

        curStatusId: 0,
        statusArr: ["活动类型", "足球", "篮球", "台球"],

        curTypeId: 0,
        typeArr: ["球队类型", "学校", "俱乐部", "协会", "球队"],

        isMenuShowed: false,

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,
            user_id: app.globalData.userInfo.user_id,

        }
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

        var ST = that.data.ST;
        that.data.allItems.user_id = app.globalData.userInfo.user_id;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getMyFavorite,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var allInfo = that.data.allItems;
                    var ret = res.data.result;

                    allInfo.competitions = ret.competitions;
                    allInfo.teams = ret.teams;
                    var favCounts = ret.fav_count;

                    var allItems = allInfo.competitions;
                    for (var i = 0; i < allItems.length; i++) {
                        var item = allItems[i].competition;
                        item.c_start_time = item.c_start_time.replace(/-/g, '.');
                        item.c_end_time = item.c_end_time.replace(/-/g, '.');
                    }
                    var allItems = allInfo.teams;
                    for (var i = 0; i < allItems.length; i++) {
                        var item = allItems[i].team;
                        item.t_created_time = item.t_created_time.replace(/-/g, '.');
                        item.t_created_time = item.t_created_time.split(' ')[0];
                        item.fav_count = favCounts[i];
                    }


                    allInfo.competitions = allInfo.competitions.sort(function(a, b) {
                        a = a.competition;
                        b = b.competition;
                        var ret = 0;
                        if (a.c_state > b.c_state) ret = 1;
                        else if (a.c_state < b.c_state) ret = -1;

                        // if (a.applies.length == 0 && b.applies.length > 0) ret = 1;
                        // else if (a.applies.length > 0 && b.applies.length == 0) ret = -1;

                        if (a.c_order != 1 && b.c_order == 1) ret = 1;
                        else if (a.c_order == 1 && b.c_order != 1) ret = -1;

                        return ret;
                    });
                    var me = app.globalData.userInfo.user_id;
                    allInfo.teams = allInfo.teams.sort(function(a, b) {
                        a = a.team;
                        b = b.team;
                        var ret = 0;
                        if (a.fav_count < b.fav_count) ret = 1;
                        else if (a.fav_count > b.fav_count) ret = -1;
                        // if (!a.isFavorited && b.isFavorited) ret = 1; // second condition
                        // else if (a.isFavorited && !b.isFavorited) ret = -1;
                        // if (!a.isApplied && b.isApplied) ret = 1;
                        // else if (a.isApplied && !b.isApplied) ret - 1;
                        if (a.user_id != me && b.user_id == me) ret = 1; // first condition
                        else if (a.user_id == me && b.user_id != me) ret = -1;
                        return ret;
                    });

                    that.setData({ allItems: allInfo });
                } else app.popup_alert(res.data.message);
            },
            complete: function() { wx.hideLoading(); }
        });

    },
    onclick_topmenu: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var updateData = {
            isMenuShowed: true,
            isMenu1Showed: false,
            isMenu2Showed: false,
            isMenu3Showed: false,
        };
        switch (type) {
            case 'news':
                wx.navigateTo({ url: '../../competition/news/news' })
                return;
                break;
            case 'city':
                updateData.isMenu1Showed = true;
                break;
            case 'status':
                updateData.isMenu2Showed = true;
                break;
            case 'type':
                updateData.isMenu3Showed = true;
                break;
        }
        that.setData(updateData);
        // console.log(type);
    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'city':
                that.data.curCityId = value;
                break;
            case 'status':
                that.data.curStatusId = value;
                break;
            case 'type':
                that.data.curTypeId = value;
                break;
        }
        that.setData({
            curCityId: that.data.curCityId,
            curStatusId: that.data.curStatusId,
            curTypeId: that.data.curTypeId,
            isMenuShowed: false
        })
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'go2CreateTeam':
                wx.navigateTo({ url: '../mine_team/mine_team?first=1' });
                break;
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
            case 'go2CompetitionDetail':
                if (!value) break;
                wx.navigateTo({ url: '../../competition/detail_competition/detail_competition?id=' + value })
                break;
            case 'go2TeamDetail':
                if (!value) break;
                wx.navigateTo({ url: '../../team/detail_team/detail_team?id=' + value })
                break;
        }

    },
    onShareAppMessage: function(res) {
        return;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "蜂云赛事",
            path: '/pages/team/index/index',
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});