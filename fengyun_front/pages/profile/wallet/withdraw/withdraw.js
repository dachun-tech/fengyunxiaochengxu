const app = getApp();

Page({
    data: {
        cost: "0.00",
        isbtnclicked: 0

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
        this.onPrepare();
        return;
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
        wx.hideLoading();
        this.setData({
            userInfo: app.globalData.userInfo,
            amount_withdraw: app.globalData.userInfo.amount_withdraw.toFixed(2),
            amount_pending: app.globalData.userInfo.amount_pending.toFixed(2),
            amount_total: (app.globalData.userInfo.amount_pending + app.globalData.userInfo.amount_withdraw).toFixed(2)
        });
        // console.log("start index page");
    },
    onCancel: function() {
        this.setData({
            showModal: false
        });
    },
    //if user will send money
    onConfirm: function(e) {
        var invalid = 0;
        // console.log("purse");
        // console.log(Number.isFinite(this.data.cost));
        if (!Number.isFinite(this.data.cost * 1)) {
            wx.showToast({
                title: '输入金额比100元小！',
                icon: 'none'
            });
            invalid = 3;
            return;
        }
        if (this.data.cost < 100) {
            wx.showToast({ title: "输入金额比100元小！", icon: 'none' });
            invalid = 1;
            return;
        }
        if (this.data.cost > 1 * this.data.available_balance) {
            wx.showToast({ title: "余额不足", icon: 'none' });
            invalid = 2;
            return;
        }
        if (this.data.isbtnclicked === 1 && invalid === 0) return;
        else if (this.data.isbtnclicked === 0 && invalid === 0) {
            this.data.isbtnclicked = 1
        }
        if (invalid === 0) {
            let that = this;
            // console.log("add binding history")
            // wx.request({
            //     url: app.globalData.mainURL + 'api/addBindingHistory',
            //     method: 'POST',
            //     header: {
            //         'content-type': 'application/json'
            //     },
            //     data: {
            //         'user_id': app.globalData.userInfo.user_id,
            //         'amount': that.data.cost
            //     },
            //     success: function(res) {
            //         if (res.data.status == true) {
            //             wx.redirectTo({
            //                 url: '../final_cancel/final_cancel?method=purse',
            //                 success: function() {
            //                     //that.data.isbtnclicked = 0
            //                 }
            //             })
            //         }
            //     }
            // })
        }
    },
    //if user will register
    onCancel1: function() {
        this.setData({
            showModal1: false
        });
    },
    onConfirm1: function() {
        this.setData({
            showModal1: false
        });
        if (this.data.isbtnclicked === 1) {
            // console.log("redirect to my purpose")
            // wx.redirectTo({
            //     url: 'wallet',
            // })
        }
    },
    //bind input data to variable
    on_Input_Cost: function(e) {
        let type = e.currentTarget.dataset.type;
        // console.log(e);
        let price = '';
        switch (type) {
            case 'all':
                price = e.currentTarget.dataset.value;
                break;
            case 'input':
                price = e.detail.value;
                break;
        }
        if (price.indexOf('.') > -1 && price.length - price.indexOf('.') > 3) {
            price = price.substr(0, price.length - 1)
        }
        this.setData({
            cost: price
        })
    },
    //bind input data to variable
    on_Input_Cost_Click: function(e) {
        var price = e.detail.value;
        price = price.trim('.');
        if (price === '0.00' || parseFloat(price) === 0.0) {
            this.setData({
                cost: ''
            })
        }
    },
    on_Input_Cost_Blur: function(e) {
        var price = e.detail.value;
        if (price === '' || parseFloat(price) === 0.0) {
            this.setData({
                cost: '0.00'
            })
        }
    },
    //when user click send button
    on_Clicked_Cost: function() {
        var that = this;
        var err = 0;
        var msgTxt = '';
        if (that.data.isbtnclicked === 1) {
            return;
        }
        that.data.isbtnclicked = 1;
        if (that.data.todayCnt >= 5) {
            err++;
            msgTxt = '今日提现次数已经用完'
        }
        if (that.data.cost * 1.0 < 2.0 || that.data.cost * 1.0 > 1000.0) {
            err++;
            msgTxt = '每笔提现金额最低2元，最高1000元'
        }
        if (that.data.cost * 1.0 > that.data.amount_withdraw) {
            err++;
            msgTxt = '提现金额大于钱包余额，请重新输入'
        }
        if (that.data.cost * 1.0 == 0.0) {
            err++;
            msgTxt = '请输入提现金额'
        }
        if (err > 0) {
            that.data.isbtnclicked = 0;
            app.popup_modal(msgTxt);
            return;
        }

        var submit_time = Date.now();
        var partner_trade_no = app.globalData.mch_id + submit_time;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.withdraw,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                'open_id': wx.getStorageSync('openid'),
                'user_id': app.globalData.userInfo.user_id,
                'user_name': app.globalData.userInfo.nickname,
                'fee': parseInt(that.data.cost * 100) / 100,
                'partner_trade_no': partner_trade_no
            },
            success: function(res) {
                if (res.data.status == 'success') {
                    wx.showModal({
                        title: '提示',
                        content: '提现申请已经提交，\n请留意您的微信余额变化',
                        showCancel: false,
                        confirmText: '我知道了',
                        success: function(res) {
                            wx.navigateBack({ delta: 1 });
                        },
                    })

                    app.popup_modal('提现申请已经提交，\n请留意您的微信余额变化');

                    // that.setData({
                    //     account_balance: res.data.result.amount,
                    //     available_balance: res.data.result.amount_withdraw,
                    //     remained_balance: (res.data.result.amount * 1 - res.data.result.amount_withdraw * 1).toFixed(2),
                    //     showModal1: true,
                    //     message: '提现申请已经提交，请留意您的微信余额变化'
                    // })
                    // wx.request({
                    //     url: app.globalData.mainURL + 'api/addBindingHistory',
                    //     method: 'POST',
                    //     header: {
                    //         'content-type': 'application/json'
                    //     },
                    //     data: {
                    //         'user_id': app.globalData.userInfo.user_id,
                    //         'partner_trade_no': partner_trade_no,
                    //         'binding_no': res.data.payment_no,
                    //         'binding_time': res.data.payment_time,
                    //         'submit_time': res.data.submit_time,
                    //         'amount': that.data.cost * 1.0
                    //     },
                    //     success: function(res) {
                    //         if (res.data.status == true) {
                    //         }
                    //     }
                    // })

                } else {
                    that.data.isbtnclicked = 0;
                    if (res.data.errmsg.indexOf('0000') > 0) {
                        res.data.errmsg = '每笔提现金额最低2元，最高1000元';
                    }
                    that.onPrepare();
                    app.popup_alert(res.data.errmsg);
                }
            }
        })
    },
    on_Clicked_Detail: function() {
        // console.log("translation details");
        wx.navigateTo({ url: '../withdraw_history/withdraw_history', })
    }
});