//index.js
//获取应用实例
const app = getApp();

Page({
    data: {
        options: {},
        menuSelected: 'progress',
        is3IconExist: 0, // -1: no button, 0: 2 buttons, 1: 3 buttons
        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            progStatusImg: [
                "../../../images/pai_red@2x.png",
                "../../../images/pai_yellow@2x.png",
                "../../../images/pai_ry@2x.png",
                "../../../images/ball_wulong@2x.png",
                "../../../images/ball_jinqiu@2x.png",
                "../../../images/ball_dianqiu@2x.png",
                "../../../images/ball_dianqiumeijin@2x.png",
                "../../../images/shangchang@2x.png",
                "../../../images/xiachang@2x.png",
                "../../../images/zhugong@2x.png",
            ],
            progStatusStr: app.globalData.progStatusStr,

            mPosSortStr: ["守门员", "后卫", "中场", "前锋", "无"],

            analyse: {},
            game: {
                team1: { t_logo: '' },
                team2: { t_logo: '' },
                g_stream: ''
            }
        }
    },
    onLoad: function(option) {
        // option.id = '5ce16fbf88c6f32dc0eb28f8';
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
    onInitStart: function(option) {
        var that = this;

        that.data.allItems.game_id = option.id;

        wx.request({
            url: app.globalData.api.root + app.globalData.api.getGameDetail,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                game_id: that.data.allItems.game_id
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var allInfo = that.data.allItems;

                    var ret = res.data.result;

                    allInfo.game = ret.game;

                    var item = allInfo.game;
                    item.scoreStr = '';
                    if (item.team1_total_score != null) {
                        item.scoreStr += item.team1_total_score;
                        if (item.team1_sub_score)
                            item.scoreStr += '(' + item.team1_sub_score + ')';
                        item.scoreStr += ' : ';
                        item.scoreStr += item.team2_total_score;
                        if (item.team2_sub_score)
                            item.scoreStr += '(' + item.team2_sub_score + ')';
                    }
                    if (item.g_state == 1) item.scoreStr = '未开始';
                    if (item.scoreStr == '') item.scoreStr = '待更新';
                    allInfo.game.scoreStr = item.scoreStr;

                    var allMembers = [];
                    for (var i = 0; i < allInfo.game.members1.length; i++) allMembers.push(allInfo.game.members1[i]);
                    for (var i = 0; i < allInfo.game.members2.length; i++) allMembers.push(allInfo.game.members2[i]);

                    allInfo.game.g_situation = allInfo.game.g_situation.sort(function(a, b) {
                        var ret = 0;
                        var aIdx = allInfo.progStatusStr.indexOf(a[2]);
                        var bIdx = allInfo.progStatusStr.indexOf(b[2]);
                        if (aIdx < bIdx) ret = 1;
                        else if (aIdx > bIdx) ret = -1;
                        if (a[1] > b[1]) ret = 1;
                        else if (a[1] < b[1]) ret = -1;
                        return ret;
                    })

                    for (var i = 0; i < allInfo.game.g_situation.length; i++) {
                        item = allInfo.game.g_situation[i];
                        var memberItem = allMembers.filter(function(a) { return a.id == item[0]; });
                        var statusIdx = allInfo.progStatusStr.indexOf(item[2]);
                        item[4] = [memberItem[0].m_name]; // member name
                        item[5] = memberItem[0].team_id; // team name
                        item[6] = [allInfo.progStatusImg[statusIdx]]; // image url
                        if (i < allInfo.game.g_situation.length - 1 && item[1] == allInfo.game.g_situation[i + 1][1]) {
                            var nextItem = allInfo.game.g_situation.splice(i + 1, 1)[0];
                            memberItem = allMembers.filter(function(a) { return a.id == nextItem[0]; });
                            statusIdx = allInfo.progStatusStr.indexOf(nextItem[2]);
                            item[4].push(memberItem[0].m_name);
                            item[6].push(allInfo.progStatusImg[statusIdx]);
                        }
                        allInfo.game.g_situation[i] = item;
                    }

                    allInfo.analyse = ret.analyse;
                    var analStr = ["an_team", "an_team1", "an_team2"];
                    for (var i = 0; i < analStr.length; i++) {
                        var analData = allInfo.analyse[analStr[i]];
                        for (var j = 0; j < analData.length; j++) {
                            var item = analData[j];
                            item.scoreStr = '';
                            if (item.team1_total_score != null) {
                                item.scoreStr += item.team1_total_score;
                                if (item.team1_sub_score)
                                    item.scoreStr += '(' + item.team1_sub_score + ')';
                                item.scoreStr += ':';
                                item.scoreStr += item.team2_total_score;
                                if (item.team2_sub_score)
                                    item.scoreStr += '(' + item.team2_sub_score + ')';
                            }
                            // if (item.scoreStr == '') item.scoreStr = '待更新';
                        }
                        // win count
                        allInfo.analyse[analStr[i]].t1win = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = (a.g_team1 == allInfo.game.team1.id && a.team1_total_score > a.team2_total_score) ||
                                (a.g_team2 == allInfo.game.team1.id && a.team1_total_score < a.team2_total_score);
                            return isWin;
                        });

                        allInfo.analyse[analStr[i]].t2win = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = (a.g_team1 == allInfo.game.team2.id && a.team1_total_score > a.team2_total_score) ||
                                (a.g_team2 == allInfo.game.team2.id && a.team1_total_score < a.team2_total_score);
                            return isWin;
                        });

                        // equal count
                        allInfo.analyse[analStr[i]].t1equal = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = a.team1_total_score && ((a.team1.id == allInfo.game.team1.id && a.team1_total_score == a.team2_total_score) ||
                                (a.team2.id == allInfo.game.team1.id && a.team1_total_score == a.team2_total_score));
                            return isWin;
                        });
                        allInfo.analyse[analStr[i]].t2equal = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = a.team2_total_score && ((a.team1.id == allInfo.game.team2.id && a.team1_total_score == a.team2_total_score) ||
                                (a.team2.id == allInfo.game.team2.id && a.team1_total_score == a.team2_total_score));
                            return isWin;
                        });

                        // fail count
                        allInfo.analyse[analStr[i]].t1fail = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = (a.team1.id == allInfo.game.team1.id && a.team1_total_score < a.team2_total_score) ||
                                (a.team2.id == allInfo.game.team1.id && a.team1_total_score > a.team2_total_score);
                            return isWin;
                        });
                        allInfo.analyse[analStr[i]].t2fail = allInfo.analyse[analStr[i]].filter(function(a) {
                            var isWin = (a.team1.id == allInfo.game.team2.id && a.team1_total_score < a.team2_total_score) ||
                                (a.team2.id == allInfo.game.team2.id && a.team1_total_score > a.team2_total_score);
                            return isWin;
                        });
                        var t1Str = allInfo.analyse[analStr[i]].t1win.length + '胜' +
                            allInfo.analyse[analStr[i]].t1equal.length + '平' +
                            allInfo.analyse[analStr[i]].t1fail.length + '负';

                        var t2Str = allInfo.analyse[analStr[i]].t2win.length + '胜' +
                            allInfo.analyse[analStr[i]].t2equal.length + '平' +
                            allInfo.analyse[analStr[i]].t2fail.length + '负';

                        allInfo.analyse[analStr[i] + 't1Str'] = t1Str;
                        allInfo.analyse[analStr[i] + 't2Str'] = t2Str;
                    }

                    var mPosSortStr = that.data.allItems.mPosSortStr;

                    for (var i = 0; i < allInfo.game.team_structure.length; i++) {
                        var item = allInfo.game.team_structure[i];
                        for (var j = 0; j < item.length; j++) {
                            var stMember = item[j];
                            var memberItem = allMembers.filter(function(a) { return a.id == stMember[0]; });
                            item[j][4] = memberItem[0].m_name;
                            item[j][5] = memberItem[0].m_number;
                            item[j][6] = memberItem[0].team_id;
                        }
                        item = item.sort(function(a, b) {
                            var aIdx = mPosSortStr.indexOf(a[2]);
                            var bIdx = mPosSortStr.indexOf(b[2]);
                            return aIdx > bIdx ? 1 : -1;
                        });
                        allInfo.game.team_structure[i] = item;
                    }

                    that.setData({ allItems: allInfo });
                } else app.popup_alert(res.data.message);
            },
            complete: function() { wx.hideLoading(); }
        });
    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        that.data.is3IconExist = 0;
        switch (type) {
            ////////////////////// Main Menu
            case 'progress':
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'analyse':
            case 'players':
                that.data.is3IconExist = -1;
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'teamItem':
                if (!value) break;
                wx.navigateTo({ url: '../../team/detail_team/detail_team?id=' + value });
                break;
            case 'memberItem':
                var team = e.currentTarget.dataset.team;
                if (!value) break;
                wx.navigateTo({ url: '../../team/detail_member/detail_member?id=' + value + '&tid=' + team });
                break;
        }
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'go2Home':
                wx.switchTab({ url: '../index/index' });
                break;
            case 'viewSite':
                if (!value) break;
                wx.navigateTo({ url: '../../other/view_site?id=' + value });
                break;
            case 'favorite':
                var value = e.currentTarget.dataset.value;
                that.setData({
                    isFavorite: 1 - value * 1
                })
                break;
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
        }

    },
    onclick_selector: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'schedule':
                that.data.allItems.isScheduleSelectorShowed = true;
                break;
            case 'scheduleContainer':
                that.data.allItems.isScheduleSelectorShowed = false;
                break;
            case 'scheduleItem':
                that.data.allItems.curScheduleId = value;
                break;
        }
        that.setData({
            allItems: that.data.allItems
        })

    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "赛况详情",
            path: '/pages/competition/detail_game/detail_game?id=' + that.data.allItems.game_id,
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});