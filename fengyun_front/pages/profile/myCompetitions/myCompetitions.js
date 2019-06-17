//index.js
//获取应用实例
const app = getApp();

Page({
    data: {
        isAuthorized: false,

        curStatusId: 0,
        statusArr: ["进行中", "已完成", "已取消"],

        isMenuShowed: false,
        typeArr: ["类型", "足球"],

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            //c_state: 1, // 0: removed, 1: created, 2: applying started, 3: applying ended, 4: start competition, 5:end competition,
        },

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

            inProgress: 0,
            completed: 1,
            cancelled: 2,
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
        var userInfo = app.globalData.userInfo;
        if (false) {
            wx.request({
                url: app.globalData.api.root + app.globalData.api.getCompetitions,
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: { user_id: userInfo.user_id },
                success: function(res) {
                    if (res.data.status === 'success') {
                        var ret = res.data.result;

                        var allItems = ret.competitions;
                        var resultList = [];
                        for (var i = 0; i < allItems.length; i++) {

                            allItems[i].isFavorited = (allItems[i]
                                    .favorite.filter(function(a) { return a.user_id == userInfo.user_id; }))
                                .length > 0;

                            allItems[i].isApplied = (allItems[i]
                                    .applies.filter(function(a) { return a.user_id == userInfo.user_id }))
                                .length > 0;

                            allItems[i].isMyCreated = (allItems[i].c_organizer_id == userInfo.organizer_id);

                            if (!allItems[i].isApplied && !allItems[i].isMyCreated) continue;

                            allItems[i].c_start_time = allItems[i].c_start_time.replace(/-/g, '.');
                            allItems[i].c_end_time = allItems[i].c_end_time.replace(/-/g, '.');
                            allItems[i].c_applying_start_time = allItems[i].c_applying_start_time.replace(/-/g, '.');
                            allItems[i].c_applying_end_time = allItems[i].c_applying_end_time.replace(/-/g, '.');
                            var status = allItems[i].c_state;
                            allItems[i].c_origin_state = parseInt(status);
                            // allItems[i].c_state = that.data.statusValArr[status];
                            // if (allItems[i].c_origin_state == 7) {
                            //     var startTime = new Date(allItems[i].c_start_time.replace(/\./g, '/') + ' 00:00:00');
                            //     var endTime = new Date(allItems[i].c_end_time.replace(/\./g, '/') + ' 23:59:59');
                            //     var curTime = new Date();
                            //     if (curTime < startTime) allItems[i].c_state = ST.waitStarting;
                            //     else if (curTime < endTime) allItems[i].c_state = ST.inProgress;
                            //     else if (curTime > endTime) allItems[i].c_state = ST.completed;
                            // }

                            status = allItems[i].c_origin_state;
                            if (status == ST.removed) status = ST.cancelled;
                            else if (status <= ST.created) status = ST.inProgress;
                            else if (status < ST.started) status = ST.inProgress;
                            else if (status == ST.started) status = ST.inProgress;
                            else if (status == ST.ended) status = ST.completed;
                            else if (status == ST.applyEnabled) status = ST.inProgress;
                            else if (status == ST.applyStopped) status = ST.inProgress;
                            allItems[i].c_state = status;
                            resultList.push(allItems[i]);
                        }

                        that.data.allItems.listOrigin = resultList;
                        that.data.allItems.list = resultList;
                        that.onclick_menuitem();

                    } else app.popup_alert(res.data.message);
                },
                complete: function() { wx.hideLoading(); }
            });
        } else {
            wx.request({
                url: app.globalData.api.root + app.globalData.api.getCompetitionByUser,
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: {
                    user_id: app.globalData.userInfo.user_id,
                },
                success: function(res) {
                    if (res.data.status === 'success') {
                        var allInfo = that.data.allItems;
                        var ret = res.data.result;

                        allInfo.listOrigin = ret;
                        var allItems = allInfo.listOrigin;
                        var curDate = new Date();
                        for (var i = 0; i < allItems.length; i++) {
                            var startTime = allItems[i].c_start_time.replace(/-/g, '/') + ' 00:00:00';
                            var endTime = allItems[i].c_end_time.replace(/-/g, '/') + ' 00:00:00';
                            startTime = new Date(startTime);
                            endTime = new Date(endTime);

                            allItems[i].c_start_time = allItems[i].c_start_time.replace(/-/g, '.');
                            allItems[i].c_end_time = allItems[i].c_end_time.replace(/-/g, '.');
                            allItems[i].c_applying_start_time = allItems[i].c_applying_start_time.replace(/-/g, '.');
                            allItems[i].c_applying_end_time = allItems[i].c_applying_end_time.replace(/-/g, '.');
                            var status = allItems[i].c_state;

                            // console.log(allItems[i].c_state);
                            if (status == 6 || status == 7) {
                                if (curDate < startTime) status = ST.inProgress;
                                else if (curDate <= endTime) status = ST.inProgress;
                                else if (curDate > endTime) status = ST.completed;
                            } else if (status == ST.removed) status = ST.cancelled;
                            else if (status <= ST.created) status = ST.inProgress;
                            else if (status < ST.started) status = ST.inProgress;
                            else if (status == ST.started) status = ST.inProgress;
                            else if (status == ST.ended) status = ST.completed;
                            else if (status == ST.applyEnabled) status = ST.inProgress;
                            else if (status == ST.applyStopped) status = ST.inProgress;
                            // console.log(status);
                            allItems[i].c_state = status;
                        }
                        // console.log(allItems);

                        that.data.allItems.list = allInfo.listOrigin.filter(function(a) { return a.c_state == 0; })

                        that.setData({ allItems: allInfo });
                    } else app.popup_alert(res.data.message);
                },
                complete: function() { wx.hideLoading(); }
            });
        }
    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = '';
        var value = 0;
        var ST = that.data.ST;
        if (e) {
            type = e.currentTarget.dataset.type;
            value = e.currentTarget.dataset.value;
        }
        var allInfo = that.data.allItems.listOrigin;
        switch (value) {
            case 0: // in progress      
            case 1: // completed
            case 2: // cancelled
                that.data.allItems.list = allInfo.filter(function(a) { return a.c_state == value; });
                break;
        }

        that.data.allItems.list = that.data.allItems.list.sort(function(a, b) {
            var ret = 0;
            if (a.c_state > b.c_state) ret = 1;
            else if (a.c_state < b.c_state) ret = -1;

            if (!a.isFavorited && b.isFavorited) ret = 1;
            else if (a.isFavorited && !b.isFavorited) ret = -1;

            if (a.applies.length == 0 && b.applies.length > 0) ret = 1;
            else if (a.applies.length > 0 && b.applies.length == 0) ret = -1;

            if (a.c_order != 1 && b.c_order == 1) ret = 1;
            else if (a.c_order == 1 && b.c_order != 1) ret = -1;

            return ret;
        });

        that.setData({
            curStatusId: value,
            allItems: that.data.allItems
        });

    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        switch (type) {
            case 'go2Authorize':
                // console.log('Go to Authorize page');
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
                var id = e.currentTarget.dataset.value;
                if (!id) break;
                wx.navigateTo({ url: '../../competition/detail_competition/detail_competition?id=' + id })
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
            path: '/pages/competition/index/index',
            success: function(res) { console.log(res) },
            fail: function(err) { console.log(err) }
        }
    }
});