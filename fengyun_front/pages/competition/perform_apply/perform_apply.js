//index.js
//获取应用实例
const app = getApp();

Page({
    data: {
        is3IconExist: -1, // -1: no button, 0: 2 buttons, 1: 3 buttons
        isProcessing: false,

        allItems: {
            serverImageRoot: app.globalData.imageRootURL,
            teamArr: ["球队姓名一", "球队姓名球队球队球队球队姓名二", "球队球队球队球队球队姓名三", "asdfasdfaasdf"],
            payTypeArr: ["微信支付", "线下支付"],
            c_fee: '',
        },

        isSelectorShowed: false,
        curTeamId: 0,

        payUser: {
            name: '',
            phone: '',
            team: 0,
            price: '',
            totalPrice: '0.00',
            width: 100
        }
    },
    onLoad: function(option) {
        var that = this;
        that.data.options = option;
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
                    var payUser = that.data.payUser;

                    var ret = res.data.result;

                    allInfo.fav_count = res.data.fav_count;
                    allInfo.isFavorite = res.data.fav_state ? 1 : 0;

                    allInfo.c_logo = ret.c_logo;

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

                    allInfo.c_helper_images = ret.c_helper_images;

                    payUser.price = allInfo.c_fee;
                    payUser.totalPrice = parseFloat(allInfo.c_fee).toFixed(2);

                    wx.request({
                        url: app.globalData.api.root + app.globalData.api.getTeamsByUser,
                        method: 'POST',
                        header: { 'content-type': 'application/json' },
                        data: {
                            user_id: app.globalData.userInfo.user_id,
                            action_type: allInfo.c_active_type
                        },
                        success: function(res) {
                            if (res.data.status == 'success') {
                                ret = res.data.result;
                                // console.log(ret);
                                allInfo.teamArr = ret;
                                if (ret.length > 0) {
                                    var members = allInfo.teamArr[that.data.curTeamId].members;
                                    members = members.filter(function(a) { return a.m_state == 1; });

                                    payUser.name = members[0].m_name;
                                    payUser.phone = members[0].m_phone;
                                    that.setData({
                                        allItems: that.data.allItems,
                                        payUser: that.data.payUser
                                    });
                                } else app.popup_alert('同一个球队不能报名到多个赛事');
                            } else app.popup_alert(res.data.message);
                        },
                        complete: function(res) { wx.hideLoading(); }
                    })
                } else app.popup_alert(res.data.message);
            },
            fail: function() { wx.hideLoading(); }
        });
    },
    oninput_value: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.detail.value;
        var width = 100;
        switch (type) {
            case 'name':
                that.data.payUser.name = value;
                break;
            case 'phone':
                if (value.length > 11) value = value.substr(0, 11);
                that.data.payUser.phone = value;
                break;
            case 'team':
                that.setData({ isSelectorShowed: true });
                return;
            case 'price':
                if (value.length > 6) width = value.length * 16;
                that.data.payUser.price = value;
                if (value != '')
                    that.data.payUser.totalPrice = parseFloat(value).toFixed(2);
                else
                    that.data.payUser.totalPrice = parseFloat(0).toFixed(2);
                that.data.payUser.width = width;
                break;
        }
        that.setData({
                payUser: that.data.payUser
            })
            // console.log(value);
    },
    onclick_selector: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var id = e.currentTarget.dataset.id;
        switch (type) {
            case 'teamSelector':
                that.data.curTeamId = id;
                var members = that.data.allItems.teamArr[that.data.curTeamId].members;
                members = members.filter(function(a) { return a.m_state == 1; });

                that.data.payUser.name = members[0].m_name;
                that.data.payUser.phone = members[0].m_phone;
                that.setData({
                    curTeamId: id,
                    payUser: that.data.payUser,
                    isSelectorShowed: false
                });
                break;
        }
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        switch (type) {
            case 'perform_apply':
                that.addApplying();
                break;
            case 'go2Home':
                wx.switchTab({ url: '../index/index' });
                break;
            case 'go2Voting':
                var value = e.currentTarget.dataset.value;
                if (!value) break;
                wx.navigateTo({ url: 'apply_voting?id=' + value });
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
    addApplying: function() {
        var that = this;

        that.data.out_trade_no = '';
        if (that.data.isProcessing) return;
        that.data.isProcessing = true;

        that.data.online_pay_price = that.data.payUser.price;
        that.data.wallet_pay_price = 0;
        if (that.data.allItems.c_payment_type == 2) {
            that.data.online_pay_price = 0;
            that.data.wallet_pay_price = that.data.payUser.price;
        }
        // console.log('----------add applying requested');

        that.data.out_trade_no = app.globalData.mch_id + Date.now() + (10000 + Math.floor(Math.random() * 90000));
        wx.request({
            url: app.globalData.api.root + app.globalData.api.addApplying,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                competition_id: that.data.allItems.competition_id,
                team_id: that.data.allItems.teamArr[that.data.curTeamId].id,
                a_name: that.data.payUser.name,
                a_phone: that.data.payUser.phone,
                wallet_pay_price: that.data.wallet_pay_price,
                online_pay_price: that.data.online_pay_price,
                out_trade_no: that.data.out_trade_no
            },
            success: function(res) {
                // console.log('---------- add applying success');
                if (res.data.status === 'success') {
                    var ret = res.data.result;
                    that.perform_pay();
                } else {
                    app.popup_alert(res.data.message);
                    that.data.isProcessing = false;
                }
            },
            fail: function(res) {
                app.popup_alert(JSON.stringify(res));
            },
        });

    },
    perform_pay: function() {
        var that = this;
        if (that.data.allItems.c_fee == 0 || that.data.allItems.c_payment_type == 2) {
            that.paySuccess();
        } else {
            var openId = app.globalData.open_id_info.openid;
            var total_fee = that.data.payUser.price;
            wx.request({
                url: app.globalData.api.root + app.globalData.api.pay,
                method: 'POST',
                header: { 'content-type': 'application/json' },
                data: {
                    body: '蜂云赛事',
                    open_id: openId,
                    total_fee: total_fee,
                    out_trade_no: that.data.out_trade_no,
                },
                success: function(res) {
                    // that.addApplying();
                    // return;

                    var ret = res.data.result;
                    wx.requestPayment({
                        timeStamp: ret.timeStamp,
                        nonceStr: ret.nonceStr,
                        package: ret.package,
                        signType: ret.signType,
                        paySign: ret.paySign,
                        success: function(res) {
                            if (res.errMsg.length <= 20) {
                                that.paySuccess();
                            } else {
                                app.popup_alert(res.errMsg);
                                that.data.isProcessing = false;
                            }
                        },
                        fail: function(res) {
                            app.popup_alert('支付失败');
                            that.data.isProcessing = false;
                        },
                    })
                },
                fail: function(res) {
                    app.popup_alert('支付失败');
                    that.data.isProcessing = false;
                },
            });
        }
    },
    paySuccess: function() {
        var that = this;
        that.data.isProcessing = false;
        wx.redirectTo({
            url: 'perform_result?id=' + 3
        })
    },
    onShareAppMessage: function(res) {
        return;
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "蜂云赛事",
            path: '/pages/competition/perform_apply/perform_apply?id=' + that.data.allItems.competition_id,
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});