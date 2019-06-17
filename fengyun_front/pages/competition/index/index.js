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
        statusArr: ["全部", "可报名", "即将开始", "进行中", "已结束"],
        statusDispArr: ["全部", "即将开始", "可报名", "进行中", "进行中", "已结束", "可报名", "已结束"],
        statusValArr: [0, 2, 1, 3, 3, 4, 1, 4],

        curTypeId: 0,
        typeArr: ["类型", "足球"],

        isMenuShowed: false,
        newsCount: 0,
        isAuthorized: true, // 0: verifying, 1: passed, 2: not passed 

        allItemsInitial: [],
        allItems: [
            // {
            //     c_active_type: 1, // 1: football
            //     c_applying_end_time: "2019-05-17",
            //     c_applying_start_time: "2019-05-09",
            //     c_city: { _id: "5ccf88cc5a9b087b7a92a79d", city_id: "140200", city: "大同市", province_id: "140000", order: 2 },
            //     c_end_time: "2019-05-31",
            //     c_logo: "/uploads/5cd4e8b5be1d6a2180d03b44/logo_1557480476066.png",
            //     c_name: "adrian 赛事1",
            //     c_order: 2, // 0: no, 1: recommend, 2: general
            //     c_province: { _id: "5ccf887265820cdd52254bd5", province_id: "140000", province: "山西省", order: 2 },
            //     c_start_time: "2019-05-19", 
            //     c_state: 1, // 0: removed, 1: created, 2: applying started, 3: applying ended, 4: start competition, 5:end competition,             
            // }
        ],
        ST: {
            removed: 0,
            created: 1,
            applyStarted: 2,
            applyEnded: 3,
            started: 4,
            ended: 5,
            applyEnabled: 6,
            applyStopped: 7,
            recommended: 1,
            normal: 2,
            verifying: 0,
            passed: 1,
            notPassed: 2,
            isOrganizer: true,
            all: 0,
            appliable: 1,
            waitStarting: 2,
            inProgress: 3,
            completed: 4,
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
        if (true || app.globalData.userInfo.nickname === '')
            app.onInitialize(function() {
                that.onInitStart(option);
            });
        else
            that.onInitStart(option);

    },
    onInitStart: function() {
        var that = this;
        var userInfo = app.globalData.userInfo;
        var ST = that.data.ST;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getCompetitions,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: { user_id: userInfo.user_id },
            success: function(res) {
                if (res.data.status === 'success') {
                    wx.hideLoading();
                    var ret = res.data.result;

                    var allItems = ret.competitions;
                    var cities = ret.cities;
                    that.data.newsCount = ret.news_count;

                    var cityArr = [{ city: "全国", city_id: 0 }];
                    for (var i = 0; i < cities.length; i++) {
                        cityArr.push(cities[i]._id);
                    }
                    for (var i = 0; i < allItems.length; i++) {
                        allItems[i].c_start_time = allItems[i].c_start_time.replace(/-/g, '.');
                        allItems[i].c_end_time = allItems[i].c_end_time.replace(/-/g, '.');
                        allItems[i].c_applying_start_time = allItems[i].c_applying_start_time.replace(/-/g, '.');
                        allItems[i].c_applying_end_time = allItems[i].c_applying_end_time.replace(/-/g, '.');
                        var status = allItems[i].c_state;
                        allItems[i].c_origin_state = parseInt(status);
                        allItems[i].c_state = that.data.statusValArr[status];
                        if (allItems[i].c_origin_state == 7) {
                            var startTime = new Date(allItems[i].c_start_time.replace(/\./g, '/') + ' 00:00:00');
                            var endTime = new Date(allItems[i].c_end_time.replace(/\./g, '/') + ' 23:59:59');
                            var curTime = new Date();
                            if (curTime < startTime) allItems[i].c_state = ST.waitStarting;
                            else if (curTime < endTime) allItems[i].c_state = ST.inProgress;
                            else if (curTime > endTime) allItems[i].c_state = ST.completed;
                        }

                        allItems[i].isFavorited = (allItems[i]
                                .favorite.filter(function(a) { return a.user_id == userInfo.user_id; }))
                            .length > 0;
                    }

                    that.data.allItemsInitial = allItems;
                    that.setData({
                        newsCount: that.data.newsCount,
                        isAuthorized: (userInfo.organizer && userInfo.identify != ST.notPassed),
                        cityArr: cityArr,
                        allItems: allItems
                    });
                    that.onclick_menuitem();

                } else app.popup_alert(res.data.message);
            }
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
                wx.navigateTo({ url: '../news/news' })
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
        var type = '';
        var value = '';
        if (e) {
            var type = e.currentTarget.dataset.type;
            var value = e.currentTarget.dataset.value;
        }
        var ST = that.data.ST;
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
        var allItems = that.data.allItemsInitial;
        if (that.data.curCity != '全国') allItems = allItems.filter(function(a) { return a.c_city.city == that.data.curCity });
        if (that.data.curStatusId != ST.all) allItems = allItems.filter(function(a) { return a.c_state == that.data.curStatusId });
        if (that.data.curTypeId != 0) allItems = allItems.filter(function(a) { return a.c_active_type == that.data.curTypeId });

        var me = app.globalData.userInfo.user_id;
        allItems = allItems.sort(function(a, b) {
            var ret = 0;
            a.isMine = (a.applies.filter(function(a) { return a.user_id == me; })).length > 0;
            b.isMine = (b.applies.filter(function(a) { return a.user_id == me; })).length > 0;
            if (a.c_state > b.c_state) ret = 1;
            else if (a.c_state < b.c_state) ret = -1;

            if (!a.isFavorited && b.isFavorited) ret = 1;
            else if (a.isFavorited && !b.isFavorited) ret = -1;

            // if (a.applies.length == 0 && b.applies.length > 0) ret = 1;
            // else if (a.applies.length > 0 && b.applies.length == 0) ret = -1;

            if (!a.isMine && b.isMine) ret = 1;
            else if (a.isMine && !b.isMine) ret = -1;

            if (a.c_order != 1 && b.c_order == 1) ret = 1;
            else if (a.c_order == 1 && b.c_order != 1) ret = -1;

            return ret;
        });

        that.setData({
            allItems: allItems,
            curCity: that.data.curCity,
            curStatusId: that.data.curStatusId,
            curTypeId: that.data.curTypeId,
            isMenuShowed: false
        })
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        switch (type) {
            case 'go2Authorize':
                wx.navigateTo({ url: '../../profile/identify/identify' });
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
                var id = e.currentTarget.dataset.id;
                if (!id) break;
                wx.navigateTo({ url: '../detail_competition/detail_competition?id=' + id })
                break;
        }

    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "蜂云赛事, 轻松管理比赛, 扩大赛事价值!",
            path: '/pages/competition/index/index',
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});