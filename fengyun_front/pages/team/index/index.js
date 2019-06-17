//index.js
//获取应用实例
const app = getApp();

Page({
    data: {
        serverImageRoot: app.globalData.imageRootURL,
        serverUploadRoot: app.globalData.uploadRootURL,

        options: {},

        curCity: '全国',
        cityArr: [],

        curStatusId: 0,
        statusArr: ["活动类型", "足球"],

        curTypeId: 0,
        typeArr: ["球队类型", "俱乐部", "球队", "学校", "协会"],

        isMenuShowed: false,
        newsCount: 0,
        user_id: 0,
        allItems: [],

        ST: {
            non_applied: 1,
            applied: 2,
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
        var userInfo = app.globalData.userInfo;
        that.data.userInfo = userInfo;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getTeams,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: { user_id: userInfo.user_id },
            success: function(res) {
                if (res.data.status === 'success') {
                    wx.hideLoading();
                    var ret = res.data.result;

                    var allItems = ret.teams;
                    var cities = ret.cities;


                    var cityArr = ["全国"];
                    for (var i = 0; i < cities.length; i++) {
                        cityArr.push(cities[i]._id);
                    }
                    var me = that.data.userInfo.user_id;
                    for (var i = 0; i < allItems.length; i++) {
                        var item = allItems[i];
                        item.t_created_time = item.t_created_time.replace(/-/g, '.');
                        item.t_created_time = item.t_created_time.split(' ')[0];
                        item.isFavorited = false;
                        if (item.favorite.length > 0) {
                            item.isFavorited = (item.favorite.filter(function(a) { return a.user_id == me; })).length > 0;
                        }
                        item.isApplied = (item.members.filter(function(it) { return it.user_id == me; })).length > 0;
                    }
                    that.data.allItemsInitial = allItems;
                    that.data.newsCount = ret.news_count;
                    that.setData({
                        newsCount: that.data.newsCount,
                        cityArr: cityArr,
                        userInfo: that.data.userInfo
                    });
                    that.onclick_menuitem();

                } else app.popup_alert(res.data.message);
            }
        });
        // console.log("start index page");
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
    },
    onclick_menuitem: function(e) {
        var that = this;
        if (e) {
            var type = e.currentTarget.dataset.type;
            var value = e.currentTarget.dataset.value;
            switch (type) {
                case 'city':
                    that.data.curCity = value;
                    break;
                case 'status':
                    that.data.curStatusId = parseInt(value);
                    break;
                case 'type':
                    that.data.curTypeId = parseInt(value);
                    break;
            }
        }
        var allItems = that.data.allItemsInitial;

        if (that.data.curCity != '全国') allItems = allItems.filter(function(a) { return a.t_city == that.data.curCity });
        if (that.data.curStatusId != 0) allItems = allItems.filter(function(a) { return a.action_type == that.data.curStatusId });
        if (that.data.curTypeId != 0) allItems = allItems.filter(function(a) { return a.t_type == that.data.typeArr[that.data.curTypeId]; });

        var me = that.data.userInfo.user_id;
        allItems = allItems.sort(function(a, b) {
            var ret = 0;
            if (a.favorite.length < b.favorite.length) ret = 1;
            else if (a.favorite.length > b.favorite.length) ret = -1;
            if (!a.isFavorited && b.isFavorited) ret = 1; // second condition
            else if (a.isFavorited && !b.isFavorited) ret = -1;
            if (!a.isApplied && b.isApplied) ret = 1;
            else if (a.isApplied && !b.isApplied) ret - 1;
            if (a.user_id != me && b.user_id == me) ret = 1; // first condition
            else if (a.user_id == me && b.user_id != me) ret = -1;
            return ret;
        });

        that.setData({
            curCity: that.data.curCity,
            curStatusId: that.data.curStatusId,
            curTypeId: that.data.curTypeId,
            isMenuShowed: false,
            allItems: allItems
        })
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        switch (type) {
            case 'go2CreateTeam':
                wx.navigateTo({ url: '../mine_team/mine_team?first=1' });
                break;
            case 'favorite':
                var value = e.currentTarget.dataset.value;
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.favorite,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        fav_id: value,
                        f_type: 1
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;
                            that.onInitStart();

                        } else app.popup_alert(res.data.message);
                    }
                });
                break;
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
            case 'go2Detail':
                var value = e.currentTarget.dataset.value;
                if (!value) break;
                wx.navigateTo({ url: '../detail_team/detail_team?id=' + value })
                break;
        }

    },
    onShareAppMessage: function(res) {
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "蜂云赛事, 创建你的战队开始新的征程!",
            path: '/pages/team/index/index',
            success: function(res) { console.log(res) },
            fail: function(err) { console.log(err) }
        }
    }
});