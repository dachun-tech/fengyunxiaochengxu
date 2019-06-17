//index.js
//获取应用实例
var WxParse = require('../../../wxParse/wxParse.js');
const app = getApp();

Page({
    data: {
        menuSelected: 'introduction',
        submenuSelected: 'schedule',
        favoriteStr: ['关注赛事', '已关注'],
        is3IconExist: 1, // -1: no button, 0: 2 buttons, 1: 3 buttons
        options: {},
        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            isShareImageShowed: false,
            isShareMessageShowed: false,
            shareImageWidth: 730,
            shareImageHeight: 960,
            shareImagePath: '',

            c_introCompetitionTxt: '',
            isFullCompetitionTxtShowed: -1,
            c_introProgressTxt: '',
            isFullProgressTxtShowed: -1,
            c_introHelperTxt: '',
            isFullHelperTxtShowed: -1,

            competition_id: 0,
            isFavorite: 0,
            fav_count: 0,

            isAllPlayerShowed: 0,
            isAllAssistShowed: 0,
            isAllRYCardShowed: 0,

            curRoundStr: '',
            roundArr: [],
            roundSortStr: [
                '第一轮', '第二轮', '第三轮', '第四轮', '第五轮',
                '第六轮', '第七轮', '第八轮', '第九轮', '第十轮',
                '第十一轮', '第十二轮', '第十三轮', '第十四轮', '第十五轮',
                '第十六轮', '第十七轮', '第十八轮', '第十九轮', '第二十轮',
                '第二十一轮', '第二十二轮', '第二十三轮', '第二十四轮', '第二十五轮',
                '第二十六轮', '第二十七轮', '第二十八轮', '第二十九轮', '第三十轮',
                '第三十一轮', '第三十二轮', '第三十三轮', '第三十四轮', '第三十五轮',
                '第三十六轮', '第三十七轮', '第三十八轮', '第三十九轮', '第四十轮',
                '第四十一轮', '第四十二轮', '第四十三轮', '第四十四轮', '第四十五轮',
                '第四十六轮', '第四十七轮', '第四十八轮', '第四十九轮', '第五十轮',
                '第五十一轮', '第五十二轮', '第五十三轮', '第五十四轮', '第五十五轮',
                '第五十六轮', '第五十七轮', '第五十八轮', '第五十九轮', '第六十轮',
                '第六十一轮', '第六十二轮', '第六十三轮', '第六十四轮', '第六十五轮',
                '第六十六轮', '第六十七轮', '第六十八轮', '第六十九轮', '第八十轮',
                '第八十一轮', '第八十二轮', '第八十三轮', '第八十四轮', '第八十五轮',
                '第八十六轮', '第八十七轮', '第八十八轮', '第八十九轮', '第九十轮',
                '第九十一轮', '第九十二轮', '第九十三轮', '第九十四轮', '第九十五轮',
                '第九十六轮', '第九十七轮', '第九十八轮', '第九十九轮', '第一百轮',
                '决赛', '半决赛', '1/4决赛', '1/8决赛', '1/16决赛', '1/32决赛', '1/64决赛', '1/128决赛',
                'A组', 'B组', 'C组', 'D组', 'E组', 'F组', 'G组', 'H组', 'I组',
                'J组', 'K组', 'L组', 'M组', 'N组', 'O组', 'P组', 'Q组', 'R组',
                'S组', 'T组', 'U组', 'V组', 'W组', 'X组', 'Y组', 'Z组',
                "全部"
            ],
            isRoundSelectorShowed: false,

            activeTypeArr: ["足球"],
            payTypeArr: ["微信支付", "线下支付"],
            btnStr: ["未开始报名", "未开始报名", "立即报名", "报名已结束", "报名已结束", "报名已结束", "立即报名", "报名已结束"],
            // c_active_type: 1, // 1: football
            // c_applying_end_time: "2019-05-13",
            // c_applying_start_time: "2019-05-09",
            // c_start_time: "2019-05-14",
            // c_end_time: "2019-05-29",
            // c_city: { _id: "5ccf88cc5a9b087b7a92a790", city_id: "120200", city: "天津市", province_id: "120000", order: 2 },
            // c_cooperator: ["adrian 协办方1", "adrian 协办方1"],
            // c_fee: 1,
            // c_helper: ["adiran 赞助商1", "adiran 赞助商1"],
            c_helper_images: [], //["/uploads/5cd6987e61e1ce3490b9321a/intro0_1557569026722.png"],
            // c_intro_competition: '<p>赛事 介绍1<img src=\"/uploads/5cd6987e61e1ce3490b9321a/0fa844af7a62de8c46b8e362b75286f4fc18ca24.png\" style=\"width: 57px;\" class=\"fr-fic fr-dib\"></p>',
            // c_intro_helper: '<p><img src=\"/uploads/5cd6987e61e1ce3490b9321a/35243c564799bc647c66d7487bbc63fc93829a47.png\" style=\"width: 193px;\" class=\"fr-fic fr-dib\" alt=\"我的赛事\"></p>',
            // c_intro_progress: '<p><span style=\"font-size: 30px; color: rgb(44, 130, 201);\">规程介绍（选填） 111</span></p>',
            c_logo: '', //"/uploads/5cd6987e61e1ce3490b9321a/logo_1557568959354.png",
            // c_manager: ["adrian 承办方1", "adrian 承办方1"],
            // c_name: "adrian赛事1",
            // c_order: 2, // 1: recommend, 2: general
            // c_organizer: ["adrian 主办方1", "adrian 主办方2"],
            // c_organizer_id: "5cd6987e61e1ce3490b9321a",
            // c_organizer_phone: "13321547584",
            // c_payment_type: 1, // 1: wechat, 2: offline
            // c_place: "我的场地1",
            // c_province: { _id: "5ccf887265820cdd52254bd3", province_id: "120000", province: "天津市", order: 2 },
            // c_ranking: [],
            // c_season: "2019-2020",
            // c_shooter: [],
            // c_state: 1, // 0: removed, 1:created, 2:start applying, 3:end applying, 4: start competition, 5:end competition, 6:allowed, 7: disabled
            // c_system: 11, // competition system(how many persons will be added)
            // c_type: 1, // 1: league(single), 2: league(double), 3: group(single), 4: group(double), 5: cup
            // created_at: "2019-05-11T18:02:39.389Z",
            // id: "5cd69dbfc8898336fc622131",
            // is_published: 2, // 1: un-publish 2: publish
            // updated_at: "2019-05-11T18:03:46.754Z",

            advertises: [],
            votes: []
        }
    },
    onLoad: function(option) {
        var that = this;
        that.data.options = option;
        if (!option.type) return;
        var mainMenus = ['introduction', 'data', 'advertise', 'apply'];
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
        var that = this;
        that.data.allItems.competition_id = option.id;

        wx.request({
            url: app.globalData.api.root + app.globalData.api.getCompetitionById,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                competition_id: that.data.allItems.competition_id
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var allInfo = that.data.allItems;

                    var ret = res.data.result;

                    allInfo.fav_count = res.data.fav_count;
                    allInfo.isFavorite = res.data.fav_state ? 1 : 0;

                    allInfo.applied_teams = res.data.applied_teams;

                    allInfo.c_logo = ret.c_logo;
                    allInfo.c_name = ret.t_short_name;

                    allInfo.c_season = ret.c_season;
                    allInfo.c_active_type = ret.c_active_type;
                    allInfo.c_name = ret.c_name;
                    allInfo.c_province = ret.c_province;
                    allInfo.c_city = ret.c_city;
                    allInfo.c_place = ret.c_place;

                    allInfo.c_start_time = ret.c_start_time.replace(/-/g, '-');
                    allInfo.c_end_time = ret.c_end_time.replace(/-/g, '-');
                    allInfo.c_applying_start_time = ret.c_applying_start_time.replace(/-/g, '.');
                    allInfo.c_applying_end_time = ret.c_applying_end_time.replace(/-/g, '.');

                    allInfo.c_system = ret.c_system;
                    allInfo.c_organizer = ret.c_organizer;
                    allInfo.c_manager = ret.c_manager;
                    allInfo.c_cooperator = ret.c_cooperator;
                    allInfo.c_helper = ret.c_helper;
                    allInfo.c_organizer_phone = ret.c_organizer_phone;

                    allInfo.c_fee = ret.c_fee;
                    allInfo.c_payment_type = ret.c_payment_type;
                    allInfo.c_state = ret.c_state;

                    var current = new Date();
                    var applyStart = new Date(ret.c_applying_start_time.replace(/-/g, '/') + ' 00:00:00');
                    var applyEnd = new Date(ret.c_applying_end_time.replace(/-/g, '/') + ' 00:00:00');
                    var c_state = ret.c_state;
                    if (c_state != 6 && c_state != 7 && c_state != 0) {
                        if (current < applyStart) allInfo.c_state = 1;
                        else if (current <= applyEnd) allInfo.c_state = 2;
                        else allInfo.c_state = 3;
                    }

                    var c_introCompetitionTxt = WxParse.wxParse('c_intro_competition', 'html', JSON.parse(ret.c_intro_competition), that).c_intro_competition.text;
                    if (c_introCompetitionTxt.length > 120) {
                        allInfo.isFullCompetitionTxtShowed = 0;
                        allInfo.c_introCompetitionTxt = c_introCompetitionTxt.substr(0, 180) + '...';
                    }

                    var c_introProgressTxt = WxParse.wxParse('c_intro_progress', 'html', JSON.parse(ret.c_intro_progress), that).c_intro_progress.text;
                    if (c_introProgressTxt.length > 120) {
                        allInfo.isFullProgressTxtShowed = 0;
                        allInfo.c_introProgressTxt = c_introProgressTxt.substr(0, 180) + '...';
                    }

                    var c_introHelperTxt = WxParse.wxParse('c_intro_helper', 'html', JSON.parse(ret.c_intro_helper), that).c_intro_helper.text;
                    if (c_introHelperTxt.length > 120) {
                        allInfo.isFullHelperTxtShowed = 0;
                        allInfo.c_introHelperTxt = c_introHelperTxt.substr(0, 180) + '...';
                    }

                    allInfo.c_helper_images = ret.c_helper_images;

                    // console.log(c_introCompetitionTxt, c_introProgressTxt, c_introHelperTxt);

                    that.setData({ allItems: that.data.allItems });
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
        // console.log('------- competition menu type : ', type);
        switch (type) {
            ////////////////////// Main Menu
            case 'introduction':
                that.data.is3IconExist = 1;
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'data':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getGamesFromCompetition,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        competition_id: that.data.allItems.competition_id
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var allInfo = that.data.allItems;
                            var ret = res.data.result;
                            allInfo.games = ret;
                            var roundArr = ["全部"];
                            var roundStr = that.data.allItems.roundSortStr;
                            var latestUpdatedTime = 0;
                            for (var i = 0; i < allInfo.games.length; i++) {
                                var item = allInfo.games[i];
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
                                if (item.g_type == 1) {
                                    item.filterStr = roundStr[item.g_round - 1];
                                } else if (item.g_type == 2) {
                                    item.filterStr = item.group_name + '组';
                                } else if (item.g_type == 3) {
                                    item.filterStr = item.g_stage;
                                }
                                roundArr.push(item.filterStr);
                                allInfo.games[i].scoreStr = item.scoreStr;
                                allInfo.games[i].roundStr = roundStr[i];
                            }
                            roundArr = app.removeDuplicated(roundArr);

                            // allInfo.roundArr = roundArr;
                            allInfo.roundArr = roundArr.sort(function(a, b) {
                                var aIdx = roundStr.indexOf(a);
                                var bIdx = roundStr.indexOf(b);
                                return aIdx > bIdx ? 1 : -1
                            });
                            allInfo.curRoundStr = roundArr[0];
                            allInfo.gamesOrigin = allInfo.games.sort(function(a, b) {
                                var ret = 0;
                                var aIdx = roundStr.indexOf(a.filterStr);
                                var bIdx = roundStr.indexOf(b.filterStr);
                                if (a.g_time > b.g_time) ret = 1;
                                else if (a.g_time < b.g_time) ret = -1;
                                if (a.g_date > b.g_date) ret = 1;
                                else if (a.g_date < b.g_date) ret = -1;
                                if (a.g_round > b.g_round) ret = 1;
                                else if (a.g_round < b.g_round) ret = -1;
                                if (aIdx > bIdx) ret = 1;
                                else if (aIdx < bIdx) ret = -1;
                                return ret;
                            });
                            // gameItem.g_state: 0-removed, 1-not started, 2-in progress, 3-ended
                            // g_type: 0-not used, 1-liansai, 2-group game, 3-winner

                            allInfo.games = that.data.allItems.gamesOrigin.filter(function(a) {
                                return a.filterStr == allInfo.curRoundStr;
                            })

                            that.setData({ allItems: that.data.allItems });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });

                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'advertise':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getAdsVotes,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        competition_id: that.data.allItems.competition_id
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var allInfo = that.data.allItems;

                            var ret = res.data.result;
                            allInfo.advertises = ret.advertises;
                            allInfo.votes = ret.votes;
                            for (var i = 0; i < allInfo.advertises.length; i++) {
                                var adTime = allInfo.advertises[i].ad_post_time;
                                adTime = adTime.replace(/T/g, ' ');
                                adTime = adTime.split('.')[0];
                                adTime = adTime.replace(/-/g, '.');
                                allInfo.advertises[i].ad_post_time = adTime

                            }
                            for (var i = 0; i < allInfo.votes.length; i++) {
                                var adTime = allInfo.votes[i].v_start_time;
                                adTime = adTime.replace(/T/g, ' ');
                                adTime = adTime.split(' ')[0];
                                adTime = adTime.replace(/-/g, '.');
                                allInfo.votes[i].v_start_time = adTime;

                                adTime = allInfo.votes[i].v_end_time;
                                adTime = adTime.replace(/T/g, ' ');
                                adTime = adTime.split(' ')[0];
                                adTime = adTime.replace(/-/g, '.');
                                allInfo.votes[i].v_end_time = adTime;

                            }

                            that.setData({ allItems: that.data.allItems });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
            case 'apply':
                that.data.is3IconExist = -1;
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
                ////////////////////// Sub Menu
            case 'players':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getShooter,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        competition_id: that.data.allItems.competition_id
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var allInfo = that.data.allItems;

                            var ret = res.data.result;
                            allInfo.playerData = ret;
                            allInfo.assistData = res.data.assists;
                            allInfo.redCardData = res.data.red_yellow_cards;
                            allInfo.playerData = allInfo.playerData.sort(function(a, b) {
                                var ret = 0;
                                if (a.sub_score < b.sub_score) ret = 1;
                                else if (a.sub_score > b.sub_score) ret = -1;
                                if (a.total_score < b.total_score) ret = 1;
                                else if (a.total_score > b.total_score) ret = -1;
                                return ret;
                            })
                            allInfo.assistData = allInfo.assistData.sort(function(a, b) {
                                var ret = 0;
                                if (a.assists < b.assists) ret = 1;
                                else if (a.assists > b.assists) ret = -1;
                                return ret;
                            })
                            allInfo.redCardData = allInfo.redCardData.sort(function(a, b) {
                                var ret = 0;
                                if (a.red_cards > b.red_cards) ret = 1;
                                else if (a.red_cards < b.red_cards) ret = -1;
                                if (a.red_cards + a.yellow_cards < b.red_cards + b.yellow_cards) ret = 1;
                                if (a.red_cards + a.yellow_cards > b.red_cards + b.yellow_cards) ret = -1;
                                return ret;
                            })



                            that.setData({ allItems: that.data.allItems });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });

                that.data.is3IconExist = 1;
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    submenuSelected: type
                });
                break;
            case 'ranking':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getRanking,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        competition_id: that.data.allItems.competition_id
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var allInfo = that.data.allItems;

                            var ret = res.data.result;
                            allInfo.gameData = ret.games;
                            allInfo.rankingData = [];
                            if (ret.rankings.length > 0) allInfo.rankingData = ret.rankings;
                            var roundSortStr = that.data.allItems.roundSortStr;
                            allInfo.all_g_stage = app.removeDuplicated(allInfo.gameData, 'g_stage');
                            allInfo.all_g_stage = allInfo.all_g_stage.sort(function(a, b) {
                                var aIdx = roundSortStr.indexOf(a);
                                var bIdx = roundSortStr.indexOf(b);
                                return aIdx > bIdx ? 1 : -1;
                            });
                            // allInfo.all_group_name = app.removeDuplicated(allInfo.rankingData, 'group_name');
                            if (allInfo.gameData.length > 0) {
                                allInfo.gameData = allInfo.gameData.sort(function(a, b) {
                                    var ret = 0;
                                    if (a.g_time < b.g_time) ret = 1;
                                    else if (a.g_time > b.g_time) ret = -1;
                                    if (a.g_date < b.g_date) ret = 1;
                                    else if (a.g_date > b.g_date) ret = -1;
                                    return ret;
                                });
                                for (var i = 0; i < allInfo.gameData.length; i++) {
                                    var item = allInfo.gameData[i];
                                    item.scoreStr = '';
                                    if (item.team1_total_score != null) {
                                        item.scoreStr += item.team1_total_score;
                                        if (item.team1_sub_score) item.scoreStr += '(' + item.team1_sub_score + ')';
                                    }
                                    if (item.scoreStr != '') {
                                        item.scoreStr += ' : ';
                                        item.scoreStr += item.team2_total_score;
                                        if (item.team2_sub_score) item.scoreStr += '(' + item.team2_sub_score + ')';
                                    }
                                    if (item.scoreStr == '') item.scoreStr = '待更新';
                                }
                            }
                            if (allInfo.rankingData.length > 0) {
                                for (var i = 0; i < allInfo.rankingData.length; i++) {
                                    // var rankingSet = allInfo.rankingData[i].group_data;
                                    allInfo.rankingData[i].group_data = allInfo.rankingData[i].group_data.sort(function(a, b) {
                                        a.rankingScore = a.win_count * 3 + a.draw_count * 1;
                                        b.rankingScore = b.win_count * 3 + b.draw_count * 1;
                                        var ret = 0;
                                        if (a.win_score < b.win_score) ret = 1;
                                        else if (a.win_score > b.win_score) ret = -1;
                                        if (a.win_score - a.lose_score < b.win_score - b.lose_score) ret = 1;
                                        else if (a.win_score - a.lose_score > b.win_score - b.lose_score) ret = -1;
                                        if (a.rankingScore < b.rankingScore) ret = 1;
                                        else if (a.rankingScore > b.rankingScore) ret = -1;
                                        return ret;
                                    });

                                    for (var j = 0; j < allInfo.rankingData[i].group_data.length; j++) {
                                        var item = allInfo.rankingData[i].group_data[j]
                                        item.rankingScore = item.win_count * 3 + item.draw_count * 1;
                                    }
                                }
                            }
                            // console.log(allInfo.rankingData);

                            that.setData({ allItems: that.data.allItems });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
                that.data.is3IconExist = 1;
            case 'schedule':
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    submenuSelected: type
                });
                break;
                ////////////////////// Detail items
            case 'gameItem':
                if (!value) break;
                wx.navigateTo({ url: '../detail_game/detail_game?id=' + value });
                break;
            case 'teamItem':
                if (!value) break;
                wx.navigateTo({ url: '../../team/detail_team/detail_team?id=' + value });
                break;
            case 'memberItem':
                var team = e.currentTarget.dataset.team;
                if (!value || !team) break;
                wx.navigateTo({ url: '../../team/detail_member/detail_member?id=' + value + '&tid=' + e.currentTarget.dataset.team });
                break;
            case 'advertiseItem':
                var itemType = e.currentTarget.dataset.itemtype;
                if (!value) break;
                if (itemType == 0) {
                    wx.navigateTo({ url: '../detail_advertise/detail_advertise?id=' + value });
                } else {
                    wx.navigateTo({ url: '../detail_voting/detail_voting?id=' + value });
                }
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
                // expand & collect buttons
            case 'isFullCompetitionTxtShowed':
            case 'isFullProgressTxtShowed':
            case 'isFullHelperTxtShowed':
                if (that.data.allItems[type] == -1) return;
                that.data.allItems[type] = 1 - that.data.allItems[type];
                that.setData({ allItems: that.data.allItems });
                break;
            case 'isAllPlayerShowed':
            case 'isAllAssistShowed':
            case 'isAllRYCardShowed':
                var len = e.currentTarget.dataset.len;
                if (type == 'isAllPlayerShowed' && len <= 10) return;
                that.data.allItems[type] = (value == 0 ? 1 : 0);
                that.setData({ allItems: that.data.allItems });
                break;
            case 'favorite':
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.favorite,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        fav_id: that.data.allItems.competition_id,
                        f_type: 2
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;

                            that.data.allItems.isFavorite = ret.fav_state ? 1 : 0;
                            that.data.allItems.fav_count = ret.fav_count;

                            that.setData({ allItems: that.data.allItems });

                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
                break;
            case 'perform_apply':
                var c_state = that.data.allItems.c_state;
                var msg = '';
                if (c_state == 6 || c_state == '2') {
                    msg = ''
                } else if (c_state == 7) {
                    msg = '赛事报名已停止了'
                } else if (c_state == 0) {
                    msg = '赛事已删除了'
                } else if (c_state == 1) {
                    msg = '赛事报名还是未开始了'
                } else { msg = '赛事报名已结束了' }
                if (msg != '') {
                    app.popup_alert(msg);
                    return;
                }
                app.showLoading();
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.getTeamsByUser,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        action_type: that.data.allItems.c_active_type
                    },
                    success: function(res) {
                        if (res.data.status == 'success') {
                            var ret = res.data.result;
                            if (ret.length > 0) {
                                if (!value) return;
                                wx.navigateTo({ url: '../perform_apply/perform_apply?id=' + value })
                            } else {
                                wx.showModal({
                                    title: '提示',
                                    content: '您目前没有可以报名的球队，需要创建球队，现在去创建吧',
                                    // showCancel: false,
                                    confirmText: '去创建',
                                    cancelText: '取消',
                                    success: function(res) {
                                        if (res.confirm) {
                                            wx.navigateTo({ url: '../../team/mine_team/mine_team??first=1' });
                                        }
                                    }
                                });
                            }
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function(res) { wx.hideLoading(); }
                });
                break;
            case 'copyContent':
                app.copyText2Clipboard(value);
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
                // share Image  operation
            case 'saveShareImage':
                var mainMenus = ['introduction', 'data', 'advertise', 'apply'];
                var subMenus = ['schedule', 'ranking', 'players'];
                var mainId = 0;
                var subId = 0;
                for (var i = 0; i < mainMenus.length; i++) {
                    if (mainMenus[i] == that.data.menuSelected) mainId = i;
                }
                for (var i = 0; i < subMenus.length; i++) {
                    if (subMenus[i] == that.data.submenuSelected) subId = i;
                }
                var pagePath = '/pages/competition/detail_competition/detail_competition';
                pagePath += '?id=' + that.data.allItems.competition_id;
                pagePath += '&type=' + mainId + '' + subId;

                that.createShareImage(pagePath);
                break;
            case 'hideShareImage':
                that.data.allItems.isShareImageShowed = false;
                that.setData({ allItems: that.data.allItems });
                break;
        }

    },
    onclick_selector: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'schedule':
                that.data.allItems.isRoundSelectorShowed = true;
                break;
            case 'scheduleContainer':
                that.data.allItems.isRoundSelectorShowed = false;
                break;
            case 'scheduleItem':
                that.data.allItems.curRoundStr = value;
                if (value == '全部') that.data.allItems.games = that.data.allItems.gamesOrigin;
                else {
                    that.data.allItems.games = that.data.allItems.gamesOrigin.filter(function(a) {
                        return a.filterStr == value;
                    })
                }
                break;
        }
        that.setData({
            allItems: that.data.allItems
        })

    },

    createShareImage: function(sharePath, introImage) {
        var that = this;
        var qrImage = app.globalData.imageRootURL + 'success@2x.png';
        introImage = app.globalData.imageRootURL + 'picture03@2x.png';
        that.data.allItems.shareImageWidth = 730;
        that.data.allItems.shareImageHeight = 960;
        if (false && that.data.menuSelected == 'data') {
            if (that.data.submenuSelected == 'ranking') {
                introImage = app.globalData.imageRootURL + 'BG_fengyun01@2x.png';
                that.data.allItems.shareImageWidth = 690;
                that.data.allItems.shareImageHeight = 1000;
            } else if (that.data.submenuSelected == 'players') {
                introImage = app.globalData.imageRootURL + 'BG_fengyun02@2x.png';
                that.data.allItems.shareImageWidth = 730;
                that.data.allItems.shareImageHeight = 1000;
            }
        }
        that.setData({ allItems: that.data.allItems });

        // that.makeCanvasImage(qrImage, introImage);
        // return;
        wx.request({
            url: app.globalData.getQRImgURL,
            data: {
                access_token: app.globalData.token,
                path: sharePath,
                user_id: app.globalData.userInfo.user_id
            },
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function(res) {
                // console.log(res.data);

                if (res.data.status) {
                    that.makeCanvasImage(app.globalData.getQRImgRoot + res.data.data, introImage);

                }
            }
        });

    },
    makeCanvasImage: function(qrImage, introImage) {
        var that = this;
        wx.downloadFile({
            url: qrImage,
            type: 'image',
            success: function(resp) {
                var qr_filePath = resp.tempFilePath;
                wx.downloadFile({
                    url: introImage,
                    type: 'image',
                    success: function(resp) {
                        var img_filePath = resp.tempFilePath;
                        const ctx = wx.createCanvasContext('shareImg');
                        var allInfo = that.data.allItems;

                        var ww = allInfo.shareImageWidth;
                        var hh = allInfo.shareImageHeight;
                        if (true || that.data.menuSelected == 'introduction') {
                            // main image
                            ctx.drawImage(img_filePath, 0, 0, ww, 668);
                            // bottom white rect
                            ctx.globalAlpha = 1.0
                            ctx.setFillStyle('#fff')
                            ctx.fillRect(0, 668, ww, hh - 668);
                            // middle opacity rect
                            ctx.globalAlpha = 0.7
                            ctx.setFillStyle('#000')
                            ctx.fillRect(0, 578, ww, 90);

                            ctx.globalAlpha = 1.0;

                            // transparent text
                            ctx.setFillStyle('#fff')
                            ctx.font = 'normal 24px PingFangSC-Regular';
                            ctx.fillText("比赛日期: " + allInfo.c_start_time + " 到 " + allInfo.c_end_time, 146, 634)

                            // title text
                            ctx.setFillStyle('#333333');
                            ctx.font = 'bold 32px PingFangSC-Regular';

                            var c_name = allInfo.c_name;
                            var delta0 = 0;
                            if (c_name.length > 15) {
                                delta0 = 50;
                                ctx.fillText(allInfo.c_name.substr(0, 15), 30, 730);
                                ctx.fillText(allInfo.c_name.substr(15), 30, 730 + delta0);
                            } else {
                                ctx.fillText(allInfo.c_name, 30, 730 + delta0);
                            }

                            var detail_addr = allInfo.c_province.province + allInfo.c_city.city;
                            var delta = 0;
                            if (detail_addr.length > 18) delta = 45;

                            ctx.font = 'normal 22px PingFangSC-Regular';
                            // main price part
                            ctx.drawImage('../../../images/my_bee_m@2x.png', 30, 758 + delta0, 28, 30);
                            ctx.fillText('报名费' + allInfo.c_fee + '元/人', 70, 780 + delta0);

                            // detail address part
                            ctx.drawImage('../../../images/place@2x.png', 30, 808 + delta0, 28, 40)

                            if (detail_addr.length > 18) {
                                ctx.fillText(detail_addr.substr(0, 18), 70, 830 + delta0)
                                ctx.fillText(detail_addr.substr(18), 70, 875 + delta0)
                            } else {
                                ctx.fillText(detail_addr, 70, 830 + delta0)
                            }
                            // phone number part
                            ctx.drawImage('../../../images/iphone@2x.png', 30, 858 + delta + delta0, 28, 30)
                            ctx.fillText(allInfo.c_organizer_phone, 70, 880 + delta + delta0);

                            // logo description part
                            ctx.setFillStyle('#333333')
                            ctx.font = '22px PingFangSC-Regular';
                            if (that.data.menuSelected == 'introduction')
                                ctx.fillText('长按扫码来参加', 540, 915);
                            else if (that.data.menuSelected == 'data' && that.data.submenuSelected == 'ranking')
                                ctx.fillText('长按扫码查看积分榜', 520, 915);
                            else if (that.data.menuSelected == 'data' && that.data.submenuSelected == 'players')
                                ctx.fillText('长按扫码查看球员榜', 520, 915);

                            //add qr-code image
                            ctx.drawImage(qr_filePath, 540, 710, 160, 160);
                        } else if (false && that.data.menuSelected == 'data') {
                            if (that.data.submenuSelected == 'ranking') {

                                // main image
                                ctx.drawImage(img_filePath, 0, 0, ww, hh);
                                // bottom opacity rect
                                ctx.globalAlpha = 0.8;
                                ctx.setFillStyle('#000')
                                ctx.fillRect(0, 770, ww, hh - 770);

                                // title text

                                ctx.globalAlpha = 1.0;
                                ctx.setFillStyle('#fff')
                                ctx.font = 'bold 30px PingFangSC-Regular';

                                var titleTxt = allInfo.c_name;
                                var delta = 0;
                                if (titleTxt.length > 15) delta = 45;

                                if (titleTxt.length > 15) {
                                    ctx.fillText(titleTxt.substr(0, 15), 30, 830)
                                    ctx.fillText(titleTxt.substr(15), 30, 880)
                                } else {
                                    ctx.fillText(titleTxt, 30, 830)
                                }

                                // logo description part
                                ctx.setFillStyle('#fff')
                                ctx.font = '22px PingFangSC-Regular';
                                ctx.fillText('长按扫码查看', 512, 980);

                                //add qr-code image
                                ctx.drawImage(qr_filePath, 512, 800, 140, 140);

                            } else if (that.data.submenuSelected == 'players') {

                                // main image
                                ctx.drawImage(img_filePath, 0, 0, ww, hh);
                                // bottom opacity rect
                                ctx.globalAlpha = 0.8;
                                ctx.setFillStyle('#000')
                                ctx.fillRect(0, 770, ww, hh - 770);

                                // title text

                                ctx.globalAlpha = 1.0;
                                ctx.setFillStyle('#fff')
                                ctx.font = 'bold 30px PingFangSC-Regular';

                                var titleTxt = allInfo.c_name;
                                var delta = 0;
                                if (titleTxt.length > 15) delta = 45;

                                if (titleTxt.length > 15) {
                                    ctx.fillText(titleTxt.substr(0, 15), 30, 830)
                                    ctx.fillText(titleTxt.substr(15), 30, 880)
                                } else {
                                    ctx.fillText(titleTxt, 30, 830)
                                }

                                // logo description part
                                ctx.setFillStyle('#fff')
                                ctx.font = '22px PingFangSC-Regular';
                                ctx.fillText('长按扫码查看', 542, 980);

                                //add qr-code image
                                ctx.drawImage(qr_filePath, 542, 800, 140, 140);

                            }
                        }
                        ctx.draw();

                        setTimeout(function() {
                            app.downloadShareImage(that, function() {
                                that.data.allItems.isShareMessageShowed = true;
                                that.setData({ allItems: that.data.allItems })
                                setTimeout(function() {
                                    that.data.allItems.isShareMessageShowed = false;
                                    that.setData({ allItems: that.data.allItems })
                                }, 3000);
                            });
                        }, 500);
                    }
                })
            }
        })
    },

    previewImg: function(e) {
        var that = this;
        var img = e.currentTarget.dataset.value;
        var imgRef = [];
        for (var i = 0; i < that.data.allItems.c_helper_images.length; i++) {
            var item = that.data.allItems.c_helper_images[i];
            imgRef.push(that.data.allItems.serverUploadRoot + item);
        }
        app.previewImg(e.currentTarget.dataset.value, imgRef);
    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        var mainMenus = ['introduction', 'data', 'advertise', 'apply'];
        var subMenus = ['schedule', 'ranking', 'players'];
        var mainId = 0;
        var subId = 0;
        for (var i = 0; i < mainMenus.length; i++) {
            if (mainMenus[i] == that.data.menuSelected) mainId = i;
        }
        for (var i = 0; i < subMenus.length; i++) {
            if (subMenus[i] == that.data.submenuSelected) subId = i;
        }
        var title = that.data.allItems.c_name;
        switch (mainId + '' + subId) {
            case '00':
                title += ', 最新动态, 快来围观!';
                break;
            case '10':
                title += ', 最新赛程, 快来围观!';
                break;
            case '11':
                title += ', 最新积分榜, 快来围观!';
                break;
            case '12':
                title += ', 最新球员榜, 快来围观!';
                break;
            case '20':
                title += ', 最新公告, 快来围观!';
                break;
            case '30':
                title += ', 快来报名吧!';
                break;
        }
        var pagePath = '/pages/competition/detail_competition/detail_competition';
        pagePath += '?id=' + that.data.allItems.competition_id;
        pagePath += '&type=' + mainId + '' + subId;
        return {
            title: title,
            path: pagePath,
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});