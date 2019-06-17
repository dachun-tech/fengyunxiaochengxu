//index.js
//获取应用实例
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

            t_logo: '',
            t_images: [],

            applyBtnStr: ['为Ta投票', '已投票', '已结束']
        }
    },
    onLoad: function(option) {
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
        that.data.allItems.team_id = option.id;
        that.data.allItems.vote_id = option.vid;

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
                    var ret = res.data.result;

                    var allInfo = that.data.allItems;

                    allInfo.vote = ret.vote;
                    allInfo.team_vote_numbers = ret.team_vote_numbers;
                    allInfo.vote_users = ret.vote_users;

                    allInfo.v_title = allInfo.vote.v_title;
                    allInfo.v_method = allInfo.vote.v_method;

                    var vote_nums = {};
                    for (var i = 0; i < allInfo.vote.v_teams.length; i++) {
                        var item = allInfo.vote.v_teams[i];
                        vote_nums[item] = allInfo.team_vote_numbers[i];
                    }

                    allInfo.total_votes = 0;
                    for (var i = 0; i < allInfo.vote.teams.length; i++) {
                        var item = allInfo.vote.teams[i];
                        allInfo.total_votes += allInfo.team_vote_numbers[i];
                        if (item.id == that.data.allItems.team_id) {
                            allInfo.t_logo = item.t_logo;
                            allInfo.t_full_name = item.t_full_name;
                            allInfo.t_short_name = item.t_short_name;
                            allInfo.t_images = item.t_images;
                            allInfo.vote_num = vote_nums[item.id];
                        }
                    }

                    if (allInfo.v_method.method_type == 1) { // total limit
                        if (allInfo.total_votes >= allInfo.v_method.method_value) allInfo.isDisabled = 1;
                    } else if (allInfo.v_method.method_type == 2) { // daily limit
                        var curDate = new Date();
                        curDate = curDate.getFullYear() + '-' + app.makeNDigit(curDate.getMonth() + 1) + '-' + app.makeNDigit(curDate.getDate());
                        var todayVotes = ret.my_votes.filter(function(a) {
                            var submitDate = a.created_at;
                            submitDate = submitDate.split('T')[0];
                            return (curDate == submitDate);
                        });
                        todayVotes = todayVotes.length;
                        if (todayVotes >= allInfo.v_method.method_value) allInfo.isDisabled = 1;
                    }

                    var end_time = allInfo.vote.v_end_time;
                    end_time = end_time.replace(/T/g, ' ');
                    end_time = end_time.replace(/-/g, '/');

                    var now = Date.now();
                    var tempTime = Date.parse(end_time);
                    var tempdiff = (tempTime - now);
                    if (tempdiff < 0) allInfo.isDisabled = 2;

                    wx.request({
                        url: app.globalData.api.root + app.globalData.api.getGamesFromTeam,
                        method: 'POST',
                        header: { 'content-type': 'application/json' },
                        data: {
                            user_id: app.globalData.userInfo.user_id,
                            team_id: that.data.allItems.team_id
                        },
                        success: function(res) {
                            if (res.data.status === 'success') {
                                var ret = res.data.result;
                                var allInfo = that.data.allItems;

                                allInfo.analyse = ret;

                                var analData = allInfo.analyse;
                                var total_score = 0;
                                for (var j = 0; j < analData.length; j++) {
                                    var item = analData[j];
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
                        },
                        complete: function() { wx.hideLoading(); }
                    });
                } else app.popup_alert(res.data.message);
            },
            fail: function() { wx.hideLoading(); }
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
            case 'applyVoting':
                if (that.data.allItems.isDisabled > 0) break;

                wx.request({
                    url: app.globalData.api.root + app.globalData.api.applyVote,
                    data: {
                        user_id: app.globalData.userInfo.user_id,
                        vote_id: that.data.allItems.vote_id,
                        team_id: that.data.allItems.team_id
                    },
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    success: function(res) {

                        if (res.data.status == 'success') {
                            that.data.allItems.isNotifyShowed = true;
                            that.onInitStart(that.data.options);
                            that.setData({ allItems: that.data.allItems })
                            setTimeout(function() {
                                that.data.allItems.isNotifyShowed = false;
                                that.setData({ allItems: that.data.allItems })
                            }, 2000)

                        } else app.popup_alert(res.data.message);
                    }
                });

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
                that.createShareImage('/pages/competition/detail_voting/apply_voting?id=' + that.data.allItems.team_id + '&vid=' + that.data.allItems.vote_id);
                break;
            case 'hideShareImage':
                that.data.allItems.isShareImageShowed = false;
                that.setData({ allItems: that.data.allItems });
                break;
        }
    },

    createShareImage: function(sharePath, introImage) {
        var that = this;
        var qrImage = app.globalData.imageRootURL + 'success@2x.png';
        var introImage = app.globalData.imageRootURL + 'picture02@2x.png';
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

                        var titleTxt = that.data.allItems.t_full_name + '正在参与' + that.data.allItems.v_title + '投票';
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
                        ctx.fillText('票数  ' + that.data.allItems.vote_num, 30, 840)

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
        var title = '老铁，请为' + that.data.allItems.t_full_name + '投上宝贵的一票, ' +
            that.data.allItems.v_method.method_text + '' +
            that.data.allItems.v_method.method_value + '票!';
        return {
            title: title,
            path: '/pages/competition/detail_voting/apply_voting?id=' + that.data.allItems.team_id +
                '&vid=' + that.data.allItems.vote_id,
            success: function(res) {
                // console.log(res)
            },
            fail: function(err) {
                // console.log(err)
            }
        }
    }
});