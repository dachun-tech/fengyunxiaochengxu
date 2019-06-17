//index.js
//获取应用实例
const app = getApp();

Page({
    data: {

        menuSelected: 'introduction',
        options: {},

        favoriteStr: ['关注球队', '已关注'],
        is3IconExist: 0, // -1: no button, 0: 2 buttons, 1: 3 buttons

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            team_id: 0,
            isFavorite: 0,
            fav_count: 0,
            isEditting: false,
            memberState: 0,

            // team information
            t_method_type: 'detail',

            user_id: app.globalData.userInfo.user_id,

            t_logo: "",
            t_logo_updated: 0,

            t_full_name: '',
            t_short_name: '',
            t_created_time: '',

            t_type: '俱乐部', // String full name
            isTeamTypeShowed: false,
            teamTypeArr: ["俱乐部", "球队", "学校", "协会"],

            action_type: 1, // Number 1:football
            isActionTypeShowed: false,
            actionTypeArr: ["足球"],

            t_province: '黑龙江省',
            t_city: '哈尔滨市',

            t_colors: ['', ''],
            isColorShowed: false,
            colorArr: ["红色", "白色", "黄色", "蓝色", "绿色", "紫色", "灰色", "棕色", "橙色", "黑色"],

            helper_name: '',
            t_images: [],
            t_images_updated: 0,
            t_intro: '',

            // team header information
            m_logo: '',
            m_name: '',
            m_phone: '',

            m_gender: 1,
            isMGenderShowed: false,
            mGenderArr: ["男", "女"],

            m_id_number: '',
            m_tall: '',
            m_age: '',

            m_pos: "无",
            isMPosShowed: false,
            mPosArr: ["无", "前锋", "中场", "后卫", "守门员"],

            m_number: '',
            m_mail: '',

            m_state: 0, // 0-removed, 1-header, 2-general, 3-in applying

            ST: {
                none: 0,
                header: 1,
                general: 2,
                inApplying: 3
            }
        }

    },
    onLoad: function(option) {
        var that = this;
        // option.id = "5cd7809c67503e1970bb44b5";
        that.data.options = option;
        if (!option.type) return;
        var mainMenus = ['introduction', 'member', 'data', 'schedule'];
        var subMenus = ['schedule', 'ranking', 'players'];
        that.setData({
            menuSelected: mainMenus[parseInt(option.type.substr(0, 1))],
            submenuSelected: subMenus[parseInt(option.type.substr(1, 1))],
        })
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
        // console.log('----------- team id: ', option.id);
        var that = this;
        that.data.allItems.team_id = option.id;
        that.data.userInfo = app.globalData.userInfo;
        var ST = that.data.allItems.ST;
        app.globalData.ischooseimage = 0;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getTeamDetail,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                team_id: that.data.allItems.team_id
            },
            success: function(res) {
                wx.hideLoading();
                if (res.data.status === 'success') {
                    var ret = res.data.result;

                    var teamInfo = that.data.allItems;
                    teamInfo.t_logo = ret.t_logo;
                    teamInfo.t_full_name = ret.t_full_name;
                    teamInfo.t_short_name = ret.t_short_name;

                    teamInfo.t_created_time = ret.t_created_time.replace(/-/g, '.');
                    teamInfo.t_created_time = teamInfo.t_created_time.split(' ')[0];

                    teamInfo.fav_count = res.data.fav_count;
                    teamInfo.isFavorite = res.data.fav_state ? 1 : 0;

                    teamInfo.origin_members = [];
                    teamInfo.members = ret.members;
                    for (var i = 0; i < teamInfo.members.length; i++) {
                        var item = teamInfo.members[i];
                        // if (item.m_name.indexOf(' ') < 0 && item.m_name.length > 8)
                        //     item.m_name = item.m_name.substr(0, 8) + ' ' + item.m_name.substr(8);
                        item.m_number = item.m_number + '';
                        teamInfo.origin_members.push(item);
                    }
                    teamInfo.t_type = ret.t_type;
                    teamInfo.action_type = ret.action_type;
                    teamInfo.t_province = ret.t_province;
                    teamInfo.t_city = ret.t_city;
                    // var t_city = ret.t_city;
                    if (ret.t_city == ret.t_province) {
                        teamInfo.t_province = '';
                    }
                    teamInfo.t_colors = ret.t_colors;
                    teamInfo.helper_name = ret.helper_name;
                    teamInfo.t_images = ret.t_images;
                    teamInfo.t_intro = JSON.parse(ret.t_intro);
                    teamInfo.user_id = ret.user_id;
                    teamInfo.myInfo = that.data.userInfo;

                    teamInfo.memberState = ST.none;
                    var memberState = teamInfo.members.filter(function(a) { return (a.user_id == app.globalData.userInfo.user_id); });
                    if (memberState.length > 0)
                        teamInfo.memberState = memberState[0].m_state;

                    that.setData({
                        allItems: that.data.allItems
                    });

                } else app.popup_alert(res.data.message);
            }
        });
    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        that.data.is3IconExist = 0;
        // console.log('------- competition menu type : ', type);
        switch (type) {
            ////////////////////// Main Menu
            case 'member':
                if (that.data.userInfo.user_id == that.data.allItems.user_id) that.data.is3IconExist = -1;
                that.data.allItems.deletedMemberIds = [];
                that.data.allItems.members = that.data.allItems.origin_members;
                that.data.allItems.isEditting = false;
                that.setData({
                    allItems: that.data.allItems,
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'data':
            case 'schedule':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getGamesFromTeam,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        team_id: that.data.allItems.team_id
                    },
                    success: function(res) {
                        wx.hideLoading();
                        if (res.data.status === 'success') {
                            var ret = res.data.result;
                            var allInfo = that.data.allItems;

                            allInfo.analyse = ret;

                            var analData = allInfo.analyse;
                            var total_score = 0;
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
                                if (item.team1.id == allInfo.team_id && item.team1_total_score) total_score += parseInt(item.team1_total_score);
                                if (item.team2.id == allInfo.team_id && item.team2_total_score) total_score += parseInt(item.team2_total_score);
                            }
                            allInfo.total_score = total_score;
                            // win count
                            allInfo.t1win = allInfo.analyse.filter(function(a) {
                                var isWin = (a.g_team1 == allInfo.team_id && a.team1_total_score > a.team2_total_score) ||
                                    (a.g_team2 == allInfo.team_id && a.team1_total_score < a.team2_total_score);
                                return isWin;
                            });

                            // equal count
                            allInfo.t1equal = allInfo.analyse.filter(function(a) {
                                var isWin = a.team1_total_score != null && ((a.team1.id == allInfo.team_id && a.team1_total_score == a.team2_total_score) ||
                                    (a.team2.id == allInfo.team_id && a.team1_total_score == a.team2_total_score));
                                return isWin;
                            });

                            // fail count
                            allInfo.t1fail = allInfo.analyse.filter(function(a) {
                                var isWin = (a.team1.id == allInfo.team_id && a.team1_total_score < a.team2_total_score) ||
                                    (a.team2.id == allInfo.team_id && a.team1_total_score > a.team2_total_score);
                                return isWin;
                            });

                            that.setData({ allItems: that.data.allItems });

                        } else app.popup_alert(res.data.message);
                    }
                });

            case 'introduction':
                that.setData({
                    allItems: that.data.allItems,
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
                ////////////////////// Detail items
            case 'gameItem':
                if (!value) break;
                wx.navigateTo({ url: '../../competition/detail_game/detail_game?id=' + value });
                break;
            case 'teamItem':
                if (!value) break;
                if (value != that.data.allItems.team_id)
                    wx.navigateTo({ url: '../../team/detail_team/detail_team?id=' + value });
                break;
            case 'memberItem':
                var team = that.data.allItems.team_id
                if (!value || !team) break;
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
                wx.switchTab({ url: '../../competition/index/index' });
                break;
            case 'favorite':
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.favorite,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        fav_id: that.data.allItems.team_id,
                        f_type: 1
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;

                            that.data.allItems.isFavorite = ret.fav_state ? 1 : 0;
                            that.data.allItems.fav_count = ret.fav_count;

                            that.setData({ allItems: that.data.allItems });

                        } else app.popup_alert(res.data.message);
                    }
                });
                break;
            case 'editTeam':
                wx.redirectTo({ url: '../mine_team/mine_team?id=' + value })
                break;
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
                // My Member Management part
            case 'editMember':
                if (that.data.allItems.members.length == 1) {
                    app.popup_modal('球员不足');
                    break;
                }
                that.data.allItems.isEditting = true;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'deleteMember':
                that.data.allItems.deletedMemberIds.push(value);
                that.data.allItems.members = that.data.allItems.origin_members.filter(function(a) { return (that.data.allItems.deletedMemberIds.indexOf(a.id) == -1); });
                that.setData({ allItems: that.data.allItems });
                break;
            case 'finishEditMember':
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.addTeam,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        team_id: that.data.allItems.team_id, // optional
                        member_ids: that.data.allItems.deletedMemberIds,
                        t_method_type: 'edit_member'
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;

                            that.data.allItems.isEditting = false;
                            that.onInitStart(that.data.options);
                            return;
                            that.setData({ allItems: that.data.allItems });

                        } else app.popup_alert(res.data.message);
                    }
                });
                break;
            case 'addMember':
            case 'applyMemberInfo':
                wx.navigateTo({ url: '../edit_member/edit_member?tid=' + that.data.allItems.team_id });
                break;
            case 'viewMemberInfo':
                var allMembers = that.data.allItems.members;
                var mineInfo = allMembers.filter(function(a) { return a.user_id == app.globalData.userInfo.user_id; });
                if (mineInfo.length > 0) {
                    wx.navigateTo({ url: '../detail_member/detail_member?tid=' + that.data.allItems.team_id + '&id=' + mineInfo[0].id });
                }
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
    previewImg: function(e) {
        app.previewImg(e.currentTarget.dataset.value);
    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        var mainMenus = ['introduction', 'member', 'data', 'schedule'];
        var subMenus = ['schedule', 'ranking', 'players'];
        var mainId = 0;
        var subId = 0;
        for (var i = 0; i < mainMenus.length; i++) {
            if (mainMenus[i] == that.data.menuSelected) mainId = i;
        }
        for (var i = 0; i < subMenus.length; i++) {
            if (subMenus[i] == that.data.submenuSelected) subId = i;
        }
        var title = that.data.allItems.t_full_name;
        switch (mainId + '0') {
            case '00':
                title += ', 最新动态, 快来围观!';
                break;
            case '10':
                title += ', 欢迎加入!';
                break;
            case '20':
                title += ', 最新战绩, 快来围观!';
                break;
            case '30':
                title += ', 最新赛程, 欢迎观看!';
                break;
        }
        var pagePath = '/pages/team/detail_team/detail_team';
        pagePath += '?id=' + that.data.allItems.team_id;
        pagePath += '&type=' + mainId + '0';
        return {
            title: title,
            path: pagePath,
            success: function(res) { console.log(res) },
            fail: function(err) { console.log(err) }
        }
    }
});