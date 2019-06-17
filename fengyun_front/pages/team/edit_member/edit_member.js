//index.js
//获取应用实例
const app = getApp();
var datePicker = require('../../../utils/datePicker');

Page({
    data: {
        menuSelected: 'introduction',
        options: {},

        favoriteStr: ['关注球队', '已关注'],
        isFavorite: 1,
        is3IconExist: -1, // -1: no button, 0: 2 buttons, 1: 3 buttons


        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            serverUploadRoot: app.globalData.uploadRootURL,

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
        // console.log('---------- edit member --------- ', option)
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
                title: '创建球员'
            });
            this.data.allItems.m_method_type = 'add';
        } else {
            wx.setNavigationBarTitle({
                title: '编辑球员信息'
            });
            this.data.allItems.m_method_type = 'edit';
        }
        this.data.allItems.team_id = this.data.options.tid;
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
    onInitStart: function() {
        var that = this;

        var option = that.data.options;
        var ST = that.data.allItems.ST;
        // datePicker Initialize

        if (!option.id) {
            app.globalData.ischooseimage = 0;
            that.data.allItems.member_id = 0;
            that.setData({ allItems: that.data.allItems });
            wx.hideLoading();
        } else {
            that.data.allItems.member_id = option.id;
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

                        var itemInfo = that.data.allItems;
                        var member = ret;
                        itemInfo.m_logo = member.m_logo;
                        itemInfo.m_name = member.m_name;
                        itemInfo.m_phone = member.m_phone;
                        itemInfo.m_gender = member.m_gender;
                        itemInfo.m_id_number = (member.m_id_number) ? (member.m_id_number) : '';
                        itemInfo.m_tall = (member.m_tall) ? (member.m_tall) : '';
                        itemInfo.m_age = (member.m_age) ? (member.m_age) : '';
                        itemInfo.m_pos = member.m_pos;
                        itemInfo.m_number = member.m_number;
                        itemInfo.m_mail = member.m_mail;
                        itemInfo.m_id = member.id;
                        itemInfo.user_id = member.user_id;
                        itemInfo.team_id = member.team_id;
                        itemInfo.m_state = member.m_state;

                        if (itemInfo.m_state == ST.header) {
                            wx.setNavigationBarTitle({
                                title: '编辑队长信息'
                            });
                        } else {
                            wx.setNavigationBarTitle({
                                title: '编辑球员信息'
                            });
                        }

                        that.setData({ allItems: that.data.allItems });

                    } else app.popup_alert(res.data.message);
                },
                complete: function() { wx.hideLoading(); }
            });
        }

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
                that.data.is3IconExist = -1;
            case 'data':
            case 'schedule':
                that.setData({
                    is3IconExist: that.data.is3IconExist,
                    menuSelected: type,
                    submenuSelected: 'schedule'
                });
                break;
            case 'member':
                that.data.is3IconExist = -1;
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
                wx.switchTab({ url: '../../competition/index/index' });
                break;
            case 'favorite':
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

            case 'submit':
                if (that.checkValidation() != '') {
                    app.popup_modal(that.checkValidation());
                    return;
                }
                var info = that.data.allItems;
                if (info.m_logo == '') info.m_logo = '/assets/main/images/man01@2x.png';
                var uploadItems = {
                    m_method_type: info.m_method_type,

                    user_id: app.globalData.userInfo.user_id,
                    t_id: info.team_id,
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
                    url: app.globalData.api.root + app.globalData.api.addMember,
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    data: uploadItems,
                    success: function(res) {
                        if (res.data.status === 'success') {
                            app.popup_notify(res.data.message);
                            setTimeout(function() {
                                wx.redirectTo({ url: '../detail_member/detail_member?id=' + res.data.result + '&tid=' + that.data.options.tid });
                            }, 1000);
                        } else app.popup_alert(res.data.message);
                    }
                });
                break;
        }

    },
    oninput_value: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        var inputContent = e.detail.value;
        switch (type) {
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
                                app.globalData.selectImageCallBack = null;
                            } else app.popup_alert(res.data.message);
                        },
                    });

                };
                wx.navigateTo({ url: '../../templates/cropper/upload-image' });
                return;
                break;
            case 'm_name':
            case 'm_id_number':
            case 'm_tall':
            case 'm_age':
            case 'm_number':
            case 'm_mail':
            case 'm_phone':
                that.data.allItems[type] = inputContent;
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
        }
        that.setData({
            allItems: that.data.allItems
        })

    },
    checkValidation: function() {
        var that = this;
        var info = that.data.allItems;
        var ST = that.data.allItems.ST;
        var err = '';

        // if (info.m_logo == '') err = '请选择' + ((info.m_state == ST.header) ? '队长' : '球员') + '照片';
        if (info.m_name == '') err = '请填写姓名';
        else if (info.m_name.length < 2) err = '姓名应为2-10个字';
        else if (!app.checkValidPhone(info.m_phone)) err = '请填写电话号码';
        else if (info.m_tall != '' && info.m_tall.length < 2) err = '身高应为2-3位数字';
        else if (info.m_age != '' && info.m_age.length < 1) err = '年龄应为1-2位数字';
        else if (info.m_number == '') err = '请填写号码';
        else if (info.m_number.length < 1) err = '号码应为1-4位数字';

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