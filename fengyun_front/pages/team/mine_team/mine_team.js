//index.js
//获取应用实例
const app = getApp();
var datePicker = require('../../../utils/datePicker');

Page({
    data: {
        menuSelected: 'introduction',
        options: [],

        favoriteStr: ['关注球队', '已关注'],
        isFavorite: 1,
        is3IconExist: -1, // -1: no button, 0: 2 buttons, 1: 3 buttons

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            team_id: 0,
            isFavorite: 0,
            fav_count: 0,
            isEditting: false,
            memberState: 0,

            // team information
            t_method_type: 'add',

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

            t_province: '',
            t_city: '',

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

            m_pos: "前锋",
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
        },
        ///////////////// date picker part
        dateTimeArray: null,
        dateTime: null,
        startYear: 1950,
        endYear: 2100,
    },
    onLoad: function(option) {
        var that = this;
        that.data.options = option;
        app.globalData.ischooseimage = 0;
    },
    getUserModalHide: function() {
        this.setData({
            getUserInfoDisabled: false
        });
        wx.showTabBar({});
        this.onShow();
    },
    onShow: function(option) {
        if (!this.data.options.id) {
            wx.setNavigationBarTitle({
                title: '创建球队'
            });
            this.data.allItems.t_method_type = 'add';
        } else {
            wx.setNavigationBarTitle({
                title: '编辑球队'
            });
            this.data.allItems.t_method_type = 'edit';
        }
        let that = app;
        let _this = this;
        if (app.globalData.ischooseimage == 0) {
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
        } else {
            _this.data.allItems.t_province = app.globalData.userProvinceName;
            _this.data.allItems.t_city = app.globalData.userCityName;
            _this.setData({ allItems: _this.data.allItems });
        }
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

        that.data.userInfo = app.globalData.userInfo;
        var ST = that.data.allItems.ST;
        // datePicker Initialize
        if (!option.id) {
            app.globalData.ischooseimage = 0;
            that.data.allItems.team_id = 0;

            var curDate = new Date();
            that.data.allItems.t_created_time = curDate.getFullYear() + '-' +
                app.makeNDigit(curDate.getMonth() + 1) + '-' +
                app.makeNDigit(curDate.getDate()) + ' 00:00:00';
            var obj = datePicker.datePicker(
                that.data.startYear,
                that.data.endYear,
                that.data.allItems.t_created_time
            );
            that.data.allItems.t_province = app.globalData.userProvinceName;
            that.data.allItems.t_city = app.globalData.userCityName;
            // console.log(app.globalData.userCityName)
            that.setData({
                allItems: that.data.allItems,
                dateTime: obj.dateTime,
                dateTimeArray: obj.dateTimeArray
            });

            wx.hideLoading();
        } else {
            that.data.allItems.team_id = option.id;
            wx.request({
                url: app.globalData.api.root + app.globalData.api.getTeamDetail,
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: {
                    user_id: app.globalData.userInfo.user_id,
                    team_id: that.data.allItems.team_id
                },
                success: function(res) {
                    if (res.data.status === 'success') {
                        var ret = res.data.result;

                        var teamInfo = that.data.allItems;
                        teamInfo.t_logo = ret.t_logo;
                        teamInfo.t_full_name = ret.t_full_name;
                        teamInfo.t_short_name = ret.t_short_name;

                        var obj = datePicker.datePicker(
                            that.data.startYear,
                            that.data.endYear,
                            ret.t_created_time
                        );
                        that.setData({
                            dateTime: obj.dateTime,
                            dateTimeArray: obj.dateTimeArray
                        })

                        teamInfo.t_created_time = ret.t_created_time;
                        // teamInfo.t_created_time = teamInfo.t_created_time.split(' ')[0];

                        teamInfo.fav_count = res.data.fav_count;
                        teamInfo.isFavorite = res.data.fav_state ? 1 : 0;

                        teamInfo.t_type = ret.t_type;
                        teamInfo.action_type = ret.action_type;
                        teamInfo.t_province = ret.t_province;
                        teamInfo.t_city = ret.t_city;
                        if (ret.t_city == ret.t_province) {
                            teamInfo.t_province = '';
                        }
                        app.globalData.userCityName = teamInfo.t_city;
                        teamInfo.t_colors = ret.t_colors;
                        teamInfo.helper_name = ret.helper_name;
                        teamInfo.t_images = ret.t_images;
                        teamInfo.t_intro = JSON.parse(ret.t_intro);
                        teamInfo.user_id = ret.user_id;
                        teamInfo.members = ret.members;
                        for (var i = 0; i < teamInfo.members.length; i++) {
                            var item = teamInfo.members[i];
                            item.m_number = item.m_number + '';
                        }
                        teamInfo.myInfo = that.data.userInfo;
                        teamInfo.t_id = ret.id;

                        var member = ret.members.filter(function(a) { return a.m_state == 1; })[0];
                        teamInfo.m_logo = member.m_logo;
                        teamInfo.m_name = member.m_name;
                        teamInfo.m_phone = member.m_phone;
                        teamInfo.m_gender = member.m_gender;
                        teamInfo.m_id_number = (member.m_id_number) ? (member.m_id_number) : '';
                        teamInfo.m_tall = (member.m_tall) ? (member.m_tall) : '';
                        teamInfo.m_age = (member.m_age) ? (member.m_age) : '';
                        teamInfo.m_pos = member.m_pos;
                        teamInfo.m_number = member.m_number;
                        teamInfo.m_mail = member.m_mail;
                        teamInfo.m_id = member.id;

                        teamInfo.memberState = ST.none;
                        var memberState = teamInfo.members.filter(function(a) { return (a.user_id == app.globalData.userInfo.user_id); });
                        if (memberState.length > 0)
                            teamInfo.memberState = memberState[0].m_state;

                        that.setData({ allItems: that.data.allItems });

                    } else app.popup_alert(res.data.message);
                },
                complete: function() { wx.hideLoading(); },
            });
        }

    },
    changeDateTime(e) {
        var that = this;
        that.setData({ dateTime: e.detail.value });
        var curSelectedDate = "" +
            that.data.dateTimeArray[0][that.data.dateTime[0]] + '-' +
            that.data.dateTimeArray[1][that.data.dateTime[1]] + '-' +
            that.data.dateTimeArray[2][that.data.dateTime[2]];
        that.data.allItems.t_created_time = curSelectedDate + ' 00:00:00';
    },
    changeDateTimeColumn(e) {
        var that = this;
        var arr = that.data.dateTime;
        var dateArr = that.data.dateTimeArray;
        arr[e.detail.column] = e.detail.value;
        dateArr[2] = datePicker.getMonthDay(dateArr[0][arr[0]], dateArr[1][arr[1]]);

        that.setData({ dateTimeArray: dateArr, dateTime: arr });
    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        that.data.is3IconExist = 0;
        switch (type) {
            ////////////////////// Main Menu
            case 'introduction':
            case 'member':
                that.data.is3IconExist = -1;
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'data':
            case 'schedule':

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
                                var isWin = a.team1_total_score && ((a.team1.id == allInfo.team_id && a.team1_total_score == a.team2_total_score) ||
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
                that.setData({
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
                if (!value || team) break;
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
            case 'colorBoxClose':
                that.data.allItems.isColorShowed = false;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'submit':
                if (that.checkValidation() != '') {
                    app.popup_modal(that.checkValidation());
                    return;
                }
                var info = that.data.allItems;
                if (info.t_logo == '') info.t_logo = '/assets/main/images/team_logo02@2x.png';
                if (info.m_logo == '') info.m_logo = '/assets/main/images/man01@2x.png';

                var t_province = info.t_province;
                var t_city = info.t_city;
                if (t_city == '北京市' || t_city == '上海市' || t_city == '天津市' || t_city == '重庆市') {
                    t_province = t_city;
                }
                var uploadItems = {
                    t_method_type: info.t_method_type,

                    team_id: info.t_id,
                    user_id: app.globalData.userInfo.user_id,
                    t_logo: info.t_logo,
                    t_full_name: info.t_full_name,
                    t_short_name: info.t_short_name,
                    t_created_time: info.t_created_time,
                    t_type: info.t_type,
                    action_type: info.action_type,
                    t_province: t_province,
                    t_city: t_city,
                    t_colors: info.t_colors,
                    helper_name: info.helper_name,
                    t_images: info.t_images,
                    t_intro: info.t_intro,

                    member_id: info.m_id,
                    m_logo: info.m_logo,
                    m_name: info.m_name,
                    m_phone: info.m_phone,
                    m_gender: info.m_gender,
                    m_id_number: info.m_id_number,
                    m_tall: info.m_tall,
                    m_age: info.m_age,
                    m_pos: info.m_pos,
                    m_number: info.m_number,
                    m_mail: info.m_mail,
                }

                wx.request({
                    url: app.globalData.api.root + app.globalData.api.addTeam,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: uploadItems,
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var createdTeamId = res.data.result;
                            if (info.t_method_type == 'add') {
                                wx.request({
                                    url: app.globalData.api.root + app.globalData.api.favorite,
                                    method: 'POST',
                                    header: { 'content-type': 'application/json' },
                                    data: {
                                        user_id: app.globalData.userInfo.user_id,
                                        fav_id: createdTeamId,
                                        f_type: 1
                                    },
                                    success: function(res) {
                                        if (res.data.status === 'success') {
                                            var ret = res.data.result;
                                            app.popup_notify(res.data.message);
                                            setTimeout(function() {
                                                wx.redirectTo({ url: '../detail_team/detail_team?id=' + createdTeamId });
                                            }, 1000);
                                        } else app.popup_alert(res.data.message);
                                    }
                                });
                            } else {
                                app.popup_notify(res.data.message);
                                setTimeout(function() {
                                    wx.redirectTo({ url: '../detail_team/detail_team?id=' + createdTeamId });
                                }, 1000);
                            }
                        } else app.popup_alert(res.data.message);
                    }
                });
                break;
                // My Member Management part
            case 'editMember':
                that.data.allItems.isEditting = true;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'finishEditMember':
                that.data.allItems.isEditting = false;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'addMember':
            case 'applyMemberInfo':
                var team = that.data.allItems.team_id;
                if (!team) break;
                wx.navigateTo({ url: '../edit_member/edit_member?tid=' + team });
                break;
            case 'viewMemberInfo':
                var team = that.data.allItems.team_id;
                if (!team) break;
                wx.navigateTo({ url: '../detail_member/detail_member?tid=' + team });
                break;
        }

    },
    oninput_value: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        var inputContent = e.detail.value;
        switch (type) {
            case 't_logo':
            case 'm_logo':
                app.globalData.ischooseimage = 1;
                app.globalData.selectImageCallBack = function(res) {
                    wx.uploadFile({
                        url: app.globalData.api.root + app.globalData.api.imageUpload,
                        filePath: res,
                        name: 'file',
                        formData: { 'userId': app.globalData.userInfo.userId },
                        success: function(res) {
                            res.data = JSON.parse(res.data);
                            // console.log(res.data);
                            if (res.data.status == 'success') {
                                that.data.allItems[type] = res.data.url;
                                that.setData({ allItems: that.data.allItems });
                            } else app.popup_alert(res.data.message);
                        },
                    });

                };
                wx.navigateTo({ url: '../../templates/cropper/upload-image' });
                return;


                app.globalData.ischooseimage = 1;
                wx.chooseImage({
                    count: 1,
                    success: function(res) {
                        var image = []; //that.data.image_path;
                        // if (res.tempFiles[0].size > 1048) {
                        for (var i = 0; i < res.tempFiles.length; i++) {
                            if (res.tempFiles[i].size > 10485760) {
                                wx.showToast({
                                    title: '图片太大，无法上传！',
                                    icon: 'none',
                                    duration: 3000
                                });
                                return;
                            }
                        }
                        for (var i = 0; i < res.tempFiles.length; i++) {
                            image[i] = res.tempFilePaths[i];
                        }

                        wx.uploadFile({
                            url: app.globalData.api.root + app.globalData.api.imageUpload,
                            filePath: image[0],
                            name: 'file',
                            formData: { 'userId': app.globalData.userInfo.userId },
                            success: function(res) {
                                res.data = JSON.parse(res.data);
                                // console.log(res.data);
                                if (res.data.status == 'success') {
                                    that.data.allItems[type] = res.data.url;
                                    that.setData({ allItems: that.data.allItems });
                                } else app.popup_alert(res.data.message);
                            },
                        });
                    },
                });
                return;
                break;

            case 't_images':
                var id = that.data.allItems.t_images.length;
                app.globalData.ischooseimage = 1;
                wx.chooseImage({
                    count: 3,
                    success: function(res) {
                        var image = []; //that.data.image_path;
                        // if (res.tempFiles[0].size > 1048) {
                        for (var i = 0; i < res.tempFiles.length; i++) {
                            if (res.tempFiles[i].size > 10485760) {
                                wx.showToast({
                                    title: '图片太大，无法上传！',
                                    icon: 'none',
                                    duration: 3000
                                });
                                return;
                            }
                        }
                        for (var i = 0; i < res.tempFiles.length; i++) {
                            image[i] = res.tempFilePaths[i];
                        }

                        wx.uploadFile({
                            url: app.globalData.api.root + app.globalData.api.imageUpload,
                            filePath: image[0],
                            name: 'file',
                            formData: { 'userId': app.globalData.userInfo.userId },
                            success: function(res) {
                                res.data = JSON.parse(res.data);
                                // console.log(res.data);
                                if (res.data.status == 'success') {
                                    that.data.allItems.t_images[id] = res.data.url;
                                    if (image.length > 1) {
                                        wx.uploadFile({
                                            url: app.globalData.api.root + app.globalData.api.imageUpload,
                                            filePath: image[1],
                                            name: 'file',
                                            formData: { 'userId': app.globalData.userInfo.userId },
                                            success: function(res) {
                                                res.data = JSON.parse(res.data);
                                                // console.log(res.data);
                                                if (res.data.status == 'success') {
                                                    that.data.allItems.t_images[(id + 1) % 3] = res.data.url;
                                                    if (image.length > 2) {
                                                        wx.uploadFile({
                                                            url: app.globalData.api.root + app.globalData.api.imageUpload,
                                                            filePath: image[2],
                                                            name: 'file',
                                                            formData: { 'userId': app.globalData.userInfo.userId },
                                                            success: function(res) {
                                                                res.data = JSON.parse(res.data);
                                                                // console.log(res.data);
                                                                if (res.data.status == 'success') {
                                                                    that.data.allItems.t_images[(id + 2) % 3] = res.data.url;
                                                                    that.setData({ allItems: that.data.allItems });
                                                                } else app.popup_alert(res.data.message);
                                                            },
                                                        });
                                                    } else {
                                                        that.setData({ allItems: that.data.allItems });
                                                    }
                                                } else app.popup_alert(res.data.message);
                                            },
                                        });
                                    } else {
                                        that.setData({ allItems: that.data.allItems });
                                    }
                                } else app.popup_alert(res.data.message);
                            },
                        });
                    },
                });
                return;
                break;
            case 'removeTeamImages':
                var teamImgs = that.data.allItems.t_images;
                teamImgs.splice(value, 1);
                break;

            case 'm_phone':
                if (inputContent.length > 11) inputContent = inputContent.substr(0, 11);
            case 't_full_name':
            case 't_short_name':
            case 't_intro':
            case 'helper_name':

            case 'm_name':
            case 'm_id_number':
            case 'm_tall':
            case 'm_age':
            case 'm_number':
            case 'm_mail':

                that.data.allItems[type] = inputContent;
                break;

            case 't_type':
                that.data.allItems.t_type = value;
                that.data.allItems.isTeamTypeShowed = false;
                break;
            case 'teamType':
                that.data.allItems.isTeamTypeShowed = true;
                break;

            case 'action_type':
                that.data.allItems.action_type = value;
                that.data.allItems.isActionTypeShowed = false;
                break;
            case 'actionType': // show selector
                that.data.allItems.isActionTypeShowed = true;
                break;

            case 't_colors':
                var curColors = that.data.allItems.t_colors;
                if (value == curColors[0]) curColors[0] = '';
                else if (value == curColors[1]) curColors[1] = '';
                else if (curColors[0] == '') curColors[0] = value;
                else if (curColors[1] == '') curColors[1] = value;
                break;
            case 'teamColor': // show selector
                that.data.allItems.isColorShowed = true;
                break;
            case 'removeTeamColor':
                var curColors = that.data.allItems.t_colors;
                curColors[value] = '';
                // that.data.allItems.isColorShowed = false;
                break;
            case 'm_gender':
                that.data.allItems.m_gender = value;
                that.data.allItems.isMGenderShowed = false;
                break;
            case 'mGender':
                that.data.allItems.isMGenderShowed = true;
                break;

            case 'm_pos':
                that.data.allItems.m_pos = value;
                that.data.allItems.isMPosShowed = false;
                break;
            case 'mPos':
                that.data.allItems.isMPosShowed = true;
                break;

            case 'detailAddress':
                app.globalData.ischooseimage = 1
                wx.navigateTo({ url: '../cities/cities' });
                // wx.chooseLocation({
                //     success: function(res) {
                //         app.getCityName(res, function(address) {
                //             that.data.allItems.t_province = address.province;
                //             that.data.allItems.t_city = address.city;
                //             that.setData({ allItems: that.data.allItems });
                //         });
                //     },
                //     complete: function(res) {
                //         // console.log(res)
                //     }
                // })
                return;
                break;
        }
        that.setData({
            allItems: that.data.allItems
        })

    },
    checkValidation: function() {
        var that = this;
        var info = that.data.allItems;
        var err = '';
        // if (info.t_logo == '') err = '请选择球队图标';
        if (info.t_full_name == '') err = '请输入球队名字';
        if (info.t_full_name.length > 14) err = '球队名称应为1-14个字';
        else if (info.t_short_name == '') err = '请输入简称名字';
        else if (info.t_short_name.length > 7) err = '简称应为1-7个字';
        else if (info.t_colors[0] == '' && info.t_colors[1] == '') err = '请选择队服颜色';
        else if (info.t_images.length == 0) err = '请选择风采展示';
        // else if (info.t_intro == '') err = '简介';
        // else if (info.m_logo == '') err = '请选择队长照片';
        else if (info.m_name == '') err = '请填写姓名';
        else if (info.m_name.length < 2 || info.m_name.length > 10) err = '姓名应为2-10个字';
        else if (!app.checkValidPhone(info.m_phone)) err = '请填写电话号码';
        else if (info.m_tall != '' && (info.m_tall.length < 2 || info.m_tall.length > 3)) err = '身高应为2-3位数字';
        else if (info.m_age != '' && (info.m_age.length < 1 || info.m_age.length > 2)) err = '年龄应为1-2位数字';
        else if (info.m_number == '') err = '请填写号码';
        else if (info.m_number.length < 1 || info.m_number.length > 4) err = '号码应为1-4位数字';

        return err;
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