//index.js
//获取应用实例
const app = getApp();
var datePicker = require('../../../utils/datePicker');

Page({
    data: {
        menuSelected: 'introduction',
        options: {},

        favoriteStr: ['关注球队', '已关注'],
        isFavorite: 0,
        is3IconExist: 0, // -1: no button, 0: 2 buttons, 1: 3 buttons

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

            isSimpleInfoShowed: true,

            image_path: [],

            curTeamTypeId: 0,
            isTeamTypeShowed: false,
            teamTypeArr: ["俱乐部", "球队", "学校", "协会"],

            curActionTypeId: 0,
            isActionTypeShowed: false,
            actionTypeArr: ["足球", "台球"],

            curColor: ["", ""],
            isColorShowed: false,
            colorArr: ["红色", "白色", "黄色", "蓝色", "绿色", "紫色", "灰色", "棕色", "橙色", "黑色"],

            progStatusStr: app.globalData.progStatusStr,

            address: '哈尔滨',

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
        startYear: 2019,
        endYear: 2100,
    },
    onLoad: function(option) {
        this.data.options = option;
        // console.log('------------- detail member ------ ', option);
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
        // datePicker Initialize
        // var obj = datePicker.datePicker(this.data.startYear, this.data.endYear);
        // that.setData({
        //     dateTime: obj.dateTime,
        //     dateTimeArray: obj.dateTimeArray
        // })
        that.data.allItems.member_id = option.id;
        var ST = that.data.allItems.ST;

        wx.request({
            url: app.globalData.api.root + app.globalData.api.getMemberDetail,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                member_id: that.data.allItems.member_id
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var ret = res.data.result;
                    // console.log(ret);

                    var itemInfo = that.data.allItems;
                    var member = ret;
                    itemInfo.m_logo = member.m_logo;
                    itemInfo.m_name = member.m_name;
                    itemInfo.m_phone = member.m_phone;
                    itemInfo.m_gender = member.m_gender;
                    itemInfo.m_id_number = member.m_id_number;
                    itemInfo.m_tall = member.m_tall;
                    itemInfo.m_age = member.m_age;
                    itemInfo.m_pos = member.m_pos;
                    itemInfo.m_number = member.m_number;
                    itemInfo.m_mail = member.m_mail;
                    itemInfo.m_id = member.id;
                    itemInfo.user_id = member.user_id;
                    itemInfo.team_id = member.team_id;
                    itemInfo.m_state = member.m_state;
                    itemInfo.t_full_name = member.team[0].t_full_name;
                    itemInfo.t_short_name = member.team[0].t_short_name;
                    itemInfo.teamheader_id = member.team[0].user_id;
                    itemInfo.is_my_team = (member.team[0].user_id == app.globalData.userInfo.user_id);
                    itemInfo.is_me = (member.user_id == app.globalData.userInfo.user_id);

                    if (itemInfo.m_state == ST.header) {
                        wx.setNavigationBarTitle({
                            title: '队长信息'
                        });
                    } else {
                        wx.setNavigationBarTitle({
                            title: '球员信息'
                        });
                    }

                    itemInfo.member_situation = res.data.member_situation;
                    itemInfo.member_appear_count = res.data.appear_count;
                    itemInfo.member_info = {};
                    for (var i = 0; i < itemInfo.progStatusStr.length; i++) {
                        var item = itemInfo.progStatusStr[i];
                        itemInfo.member_info[item] = 0;
                    }
                    for (var i = 0; i < itemInfo.member_situation.length; i++) {
                        var item = itemInfo.member_situation[i];
                        itemInfo.member_info[item[2]]++;
                    }

                    if (itemInfo.is_my_team || itemInfo.is_me) {
                        itemInfo.isSimpleInfoShowed = false;
                    } else {
                        itemInfo.isSimpleInfoShowed = true;
                    }
                    that.setData({ allItems: that.data.allItems });
                    wx.hideLoading();

                    // wx.request({
                    //     url: app.globalData.api.root + app.globalData.api.getTeamDetail,
                    //     method: 'POST',
                    //     header: {
                    //         'content-type': 'application/json'
                    //     },
                    //     data: {
                    //         user_id: app.globalData.userInfo.user_id,
                    //         team_id: that.data.allItems.team_id
                    //     },
                    //     success: function(res) {
                    //         if (res.data.status === 'success') {
                    //             var ret = res.data.result;

                    //             var teamInfo = that.data.allItems;

                    //             var members = ret.members;
                    //             var isMineTeam = false;
                    //             var memberState = members.filter(function(a) { return (a.user_id == app.globalData.userInfo.user_id); });
                    //             if (memberState.length > 0) {
                    //                 if (memberState[0].m_state == ST.header || memberState[0].m_state == ST.general) isMineTeam = true;
                    //             }
                    //             if (isMineTeam) teamInfo.isSimpleInfoShowed = false;

                    //         } else app.popup_alert(res.data.message);
                    //     },
                    //     complete: function() {
                    //     }
                    // });
                } else app.popup_alert(res.data.message);
            },
            fail: function() {
                wx.hideLoading();
            },
        });

    },
    onclick_menuitem: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        that.data.is3IconExist = -1;
        // console.log('------- competition menu type : ', type);
        switch (type) {
            ////////////////////// Main Menu
            case 'introduction':
            case 'data':
            case 'schedule':
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'member':
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
                ////////////////////// Detail items
            case 'gameItem':
                wx.redirectTo({ url: '../../competition/detail_game/detail_game?id=' + value });
                break;
            case 'advertiseItem':
                var itemType = e.currentTarget.dataset.itemtype;
                if (itemType == 0) {
                    wx.redirectTo({ url: '../detail_advertise/detail_advertise?id=' + value });
                } else {
                    wx.redirectTo({ url: '../detail_voting/detail_voting?id=' + value });
                }
                break;
        }
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            // global button actions
            case 'go2Home':
                wx.switchTab({ url: '../../competition/index/index' });
                break;
            case 'favorite':
                that.setData({
                    isFavorite: 1 - value * 1
                })
                break;
                // edit button actions
            case 'colorBoxClose':
                that.data.allItems.isColorShowed = false;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'confirm':
                that.setData({
                    isMenuShowed: false,
                    isMenu1Showed: false,
                    isMenu2Showed: false,
                    isMenu3Showed: false,
                });
                break;
                // bottom button actions
            case 'editMember':
                wx.redirectTo({ url: '../edit_member/edit_member?id=' + value + '&tid=' + that.data.options.tid });
                break;
            case 'navBack':
                wx.navigateBack({ delta: 1 });
                break;
                // if my member
            case 'rejectMember':
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.allowMember,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        member_id: that.data.allItems.member_id,
                        m_identify: 'false'
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;
                            wx.navigateBack({ delta: 1 });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
                break;
            case 'allowMember':
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.allowMember,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        member_id: that.data.allItems.member_id,
                        m_identify: 'true'
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;
                            wx.navigateBack({ delta: 1 });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
                break;
            case 'rejectMember':
                wx.request({
                    url: app.globalData.api.root + app.globalData.api.allowMember,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        member_id: that.data.allItems.member_id,
                        m_identify: 'false'
                    },
                    success: function(res) {
                        if (res.data.status === 'success') {
                            var ret = res.data.result;
                            wx.navigateBack({ delta: 1 });
                        } else app.popup_alert(res.data.message);
                    },
                    complete: function() { wx.hideLoading(); }
                });
                break;
        }

    },
    oninput_value: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'changeLogo':
                // console.log('Button Clicked');
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
                                that.data.overimagecount++;
                            }
                        }
                        for (var i = 0; i < res.tempFiles.length; i++) {
                            image[i] = res.tempFilePaths[i];
                        }
                        that.data.allItems.image_path = image;
                        that.setData({ allItems: that.data.allItems });

                        var image_array = that.data.allItems.image_path;
                        wx.uploadFile({
                            url: app.globalData.api.root + app.globalData.api.imageUpload,
                            filePath: image_array[0],
                            name: 'file',
                            formData: { 'userId': app.globalData.userInfo.userId },
                            success: function(res) {
                                res.data = JSON.parse(res.data);
                                // console.log(res.data);
                                if (res.data.status == 'success') {
                                    // console.log(res.data.url);
                                } else app.popup_alert(res.data.message);
                            },
                        });
                    },
                });
                return;
                break;
            case 'teamType':
                that.data.allItems.isTeamTypeShowed = true;
                break;
            case 'teamTypeItem':
                that.data.allItems.curTeamTypeId = value;
                that.data.allItems.isTeamTypeShowed = false;
                break;
            case 'actionType':
                that.data.allItems.isActionTypeShowed = true;
                break;
            case 'actionTypeItem':
                that.data.allItems.curActionTypeId = value;
                that.data.allItems.isActionTypeShowed = false;
                break;
            case 'teamColor':
                that.data.allItems.isColorShowed = true;
                break;
            case 'teamColorItem':
                var curColors = that.data.allItems.curColor;
                if (value == curColors[0]) curColors[0] = '';
                else if (value == curColors[1]) curColors[1] = '';
                else if (curColors[0] == '') curColors[0] = value;
                else if (curColors[1] == '') curColors[1] = value;
                break;
            case 'teamColorRemove':
                var curColors = that.data.allItems.curColor;
                curColors[value] = '';
                // that.data.allItems.isColorShowed = false;
                break;
            case 'mGender':
                that.data.allItems.isMGenderShowed = true;
                break;
            case 'mGenderItem':
                that.data.allItems.curMGenderId = value;
                that.data.allItems.isMGenderShowed = false;
                break;
            case 'mPos':
                that.data.allItems.isMPosShowed = true;
                break;
            case 'mPosItem':
                that.data.allItems.curMPosId = value;
                that.data.allItems.isMPosShowed = false;
                break;

            case 'detailAddress':
                app.globalData.ischooseimage = 1
                wx.chooseLocation({
                    success: function(res) {
                        that.data.longitude = res.longitude
                        that.data.latitude = res.latitude;

                        var got_address = res.address;

                        var url = 'https://restapi.amap.com/v3/geocode/regeo?key=8eb63e36d0b6d7d29a392503a4a80f6c&location=' + res.longitude + ',' + res.latitude + '&poitype=&radius=&extensions=all&batch=false&roadlevel=0';

                        //get activity array
                        wx.request({
                            url: url,
                            success: function(res) {
                                //console.log('got location');
                                //console.log(res.data);
                                //console.log(res.data.regeocode.addressComponent);
                                var province_name = res.data.regeocode.addressComponent.province
                                var city_name = res.data.regeocode.addressComponent.city
                                var area_name = res.data.regeocode.addressComponent.district

                                if (got_address == "") {
                                    got_address = res.data.regeocode.formatted_address;
                                }
                                that.data.allItems.address = got_address;
                                that.setData({ allItems: that.data.allItems });
                            }
                        })
                    },
                    complete: function(res) {
                        // console.log(res)
                    }
                })
                return;
                break;
        }
        that.setData({ allItems: that.data.allItems })

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