//index.js
//获取应用实例

var WxParse = require('../../../wxParse/wxParse.js');
const app = getApp();

Page({
    data: {
        mainImgs: ["banner_toupiao@2x.png"],
        menuSelected: 'progress',
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
            isDisabled: 0,

            applyBtnStr: ['投票', '已投票', '已结束', '未开始'],

            _tmr: 0,
        }
    },
    onLoad: function(option) {
        this.data.options = option;
    },
    onHide: function() {
        clearInterval(this.data._tmr);
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
        var ST = that.data.ST;
        that.data.allItems.user_id = app.globalData.userInfo.user_id;
        that.data.allItems.vote_id = option.id;
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getVoteDetail,
            method: 'POST',
            header: { 'content-type': 'application/json' },
            data: {
                user_id: app.globalData.userInfo.user_id,
                vote_id: that.data.allItems.vote_id
            },
            success: function(res) {
                if (res.data.status === 'success') {
                    var allInfo = that.data.allItems;
                    var ret = res.data.result;

                    allInfo.vote = ret.vote;
                    allInfo.team_nums = ret.team_vote_numbers;

                    allInfo.total_users = 0;
                    if (ret.vote_users.length > 0) allInfo.total_users = ret.vote_users[0].user_vote_numbers;
                    var vote_nums = {};
                    for (var i = 0; i < allInfo.vote.v_teams.length; i++) {
                        var item = allInfo.vote.v_teams[i];
                        vote_nums[item] = allInfo.team_nums[i];
                    }

                    allInfo.total_votes = 0;
                    for (var i = 0; i < allInfo.vote.teams.length; i++) {
                        allInfo.vote.teams[i].vote_num = vote_nums[allInfo.vote.teams[i].id];
                        allInfo.total_votes += allInfo.team_nums[i];
                    }

                    // if (allInfo.total_votes >= allInfo.vote.v_method.method_value) allInfo.isDisabled = 1;

                    allInfo.vote.teams = allInfo.vote.teams.sort(function(a, b) { return a.vote_num < b.vote_num ? 1 : -1 });

                    var start_time = allInfo.vote.v_start_time;
                    start_time = start_time.replace(/T/g, ' ');
                    start_time = start_time.replace(/-/g, '/');
                    start_time = start_time.split('.')[0];
                    if (Date.parse(start_time) - Date.now() > 0) {
                        that.data.allItems.isDisabled = 3;
                    }

                    var end_time = allInfo.vote.v_end_time;
                    end_time = end_time.replace(/T/g, ' ');
                    end_time = end_time.replace(/-/g, '/');
                    end_time = end_time.split('.')[0];

                    clearInterval(that.data._tmr);
                    that.data._tmr = setInterval(function() {
                        var now = Date.now();
                        var tempTime = Date.parse(end_time);
                        var tempdiff = (tempTime - now);
                        if (tempdiff < 0) {
                            tempdiff = 0;
                            clearInterval(that.data._tmr);
                            that.data.allItems.isDisabled = 2;
                        }
                        var remain_day = Math.floor(tempdiff / 86400000);
                        tempdiff = tempdiff - remain_day * 86400000;
                        var remain_hr = Math.floor(tempdiff / 3600000);
                        tempdiff = tempdiff - remain_hr * 3600000;
                        var remain_min = Math.floor(tempdiff / 60000);
                        var remain_sec = Math.floor((tempdiff - remain_min * 60000) / 1000);
                        that.data.allItems.remainedTime = remain_day + '天 ' +
                            app.makeNDigit(remain_hr) + '时' +
                            app.makeNDigit(remain_min) + '分' +
                            app.makeNDigit(remain_sec) + '秒';
                        that.setData({
                            allItems: that.data.allItems
                        })
                    }, 1000);
                    WxParse.wxParse('v_intro', 'html', JSON.parse(allInfo.vote.v_intro), that);

                    that.setData({ allItems: allInfo });
                } else app.popup_alert(res.data.message);
            },
            complete: function() { wx.hideLoading(); }
        });
    },
    onclick_button: function(e) {
        var that = this;
        var type = e.currentTarget.dataset.type;
        var value = e.currentTarget.dataset.value;
        switch (type) {
            case 'go2Home':
                wx.switchTab({ url: '../index/index' });
                break;
            case 'go2Voting':
                var value = e.currentTarget.dataset.value;
                if (!value) break;
                wx.navigateTo({ url: 'apply_voting?id=' + value + '&vid=' + that.data.allItems.vote_id });
                break;
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
                that.createShareImage('pages/competition/detail_voting/detail_voting?id=' + that.data.allItems.vote_id);
                break;
            case 'hideShareImage':
                that.data.allItems.isShareImageShowed = false;
                that.setData({ allItems: that.data.allItems });
                break;
            case 'teamItem':
                if (!value) break;
                wx.navigateTo({ url: '../../team/detail_team/detail_team?id=' + value });
                break;
        }

    },

    createShareImage: function(sharePath, introImage) {
        var that = this;
        var qrImage = app.globalData.imageRootURL + 'success@2x.png';
        var introImage = app.globalData.imageRootURL + 'picture01@2x.png';
        that.data.allItems.shareImageWidth = 730;
        that.data.allItems.shareImageHeight = 960;
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

                        var ww = that.data.allItems.shareImageWidth;
                        var hh = that.data.allItems.shareImageHeight;
                        // main image
                        ctx.drawImage(img_filePath, 0, 0, ww, 668);
                        // bottom white rect
                        ctx.globalAlpha = 1.0
                        ctx.setFillStyle('#fff')
                        ctx.fillRect(0, 668, ww, hh - 668);

                        // title text
                        ctx.setFillStyle('#333333')
                        ctx.font = 'bold 30px PingFangSC-Regular';

                        var titleTxt = that.data.allItems.vote.v_title;
                        var delta = 0;
                        if (titleTxt.length > 15) delta = 45;

                        if (titleTxt.length > 15) {
                            ctx.fillText(titleTxt.substr(0, 15), 30, 730)
                            ctx.fillText(titleTxt.substr(15), 30, 780)
                        } else {
                            ctx.fillText(titleTxt, 30, 730)
                        }

                        ctx.setFillStyle('#6cab3b');
                        ctx.font = 'normal 28px PingFangSC-Regular';
                        // main price part
                        ctx.fillText('参与者  ' + that.data.allItems.vote.teams.length, 30, 840)

                        // logo description part
                        ctx.setFillStyle('#333333')
                        ctx.font = 'normal 22px PingFangSC-Regular';
                        ctx.fillText('扫码为Ta投票', 550, 910);

                        //add qr-code image
                        ctx.drawImage(qr_filePath, 540, 710, 160, 160);

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
        app.previewImg(e.currentTarget.dataset.value);
    },
    onShareAppMessage: function(res) {
        var that = this;
        if (res.from === 'button') {
            // console.log(res.target);
        }
        return {
            title: "老铁, 比赛很精彩, 为你喜欢的球队投一票!",
            path: 'pages/competition/detail_voting/detail_voting?id=' + that.data.allItems.vote_id,
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});