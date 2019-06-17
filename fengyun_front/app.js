//app.js
App({
    globalData: {
        appId: 'wx772b3b3ff5817bdc',
        app_key: '614253f6dfe5ad9d89bbad760dc0bdde',
        mch_id: '1529374141',
        mch_key: '18846140810joey18846140510joey18',
        user_code: '',
        token: '',
        userInfo: {
            openid: '',
            user_id: '',
            nickname: '',
            avatar: '',
            name: '',
            gender: 2,
            phone: '',
            account_name: '',
            disabledState: false,
            organizer: false,
            identify: 0,
            role: 0,
            amount_pending: 0,
            amount_withdraw: 0
        },
        progStatusStr: ["红牌", "黄牌", "两黄变一红", "乌龙球", "进球", "点球", "点球未进", "上场", "下场", "助攻"],
        getUserInfoDisabled: false,
        getUserLocationDisabled: false,
        initDisabled: false,
        ischooseimage: 0,

        isLocal: false,
        // isLocal: true,

        imageRootURL: 'https://fengquba.cn/assets/main/images/',
        uploadRootURL: 'https://fengquba.cn',
        imageRootURL_L: 'http://192.168.2.14:3003/assets/main/images/',
        uploadRootURL_L: 'http://192.168.2.14:3000',

        smsApiURL: 'https://www.fengteam.cn/sms/SendTemplateSMS.php',
        getQRImgURL: 'https://www.fengteam.cn/backend3/api/datamanage/getQR',
        getQRImgRoot: 'https://www.fengteam.cn/backend3/',
        getCityURL: 'https://www.fengteam.cn/backend3/api/datamanage/getAllCities',
        api: {
            root: 'https://fengquba.cn/api/',
            root_L: 'http://192.168.2.14:3000/api/',
            getOpenId: 'getOpenId',
            getUserState: 'getUserState',

            addUser: 'addUser', // add new User
            favorite: 'favorites', // get and set favorite status

            getNotifications: 'get-notifications', // get notifications
            getTransactions: 'get-transactions', // get notifications
            getWithdraws: 'get-withdraws', // get notifications

            getCompetitions: 'competition/getAll', // get competition list of first index page
            getCompetitionById: 'competition/getById',
            getCompetitionByUser: 'competition/get-by-user',
            getShooter: 'competition/get-shooter',
            getRanking: 'competition/get-ranking',
            getTeamsByUser: 'get-teams-by-user-id', // get team by user id(for applying)

            getAdsVotes: 'get-ads-votes', // get team by user id
            getAdDetail: 'get-ad-detail', // get team by user id
            getVoteDetail: 'get-vote-detail', // get vote detail
            applyVote: 'add-voting', // add vote

            getGamesFromCompetition: 'game/get-from-competition', // get all games in competition
            getGameDetail: 'game/get-detail', // get all games in competition
            getGamesFromTeam: 'game/get-games-from-team', // get all games in competition

            addApplying: 'add-applying', // perform apply

            addOrganizer: 'addOrganizer', // add organizer in identify_input page

            addTeam: 'add-edit-team', // add team and teamheader
            getTeams: 'get-all-teams', // get all teams
            getTeamDetail: 'get-team-detail', // get team and teamheader
            getMyTeams: 'team/get-teams-by-user', // get teams from user id(for mine)
            getMyFavorite: 'favorite/get-all', // get all favorites

            getMemberDetail: 'get-member-detail', // get member detail
            addMember: 'add-edit-member', // get member detail
            allowMember: 'member/allow-member', // get member detail


            imageUpload: 'image-upload', // pure image file uploading 

            pay: 'weixin-pay-order',
            refund: 'weixin-refund-order',
            withdraw: 'weixin-withdraw',
        },
        selectImageCallback: null
    },
    onLaunch: function() {
        if (this.globalData.isLocal) {
            this.globalData.imageRootURL = this.globalData.imageRootURL_L;
            this.globalData.uploadRootURL = this.globalData.uploadRootURL_L;
            this.globalData.api.root = this.globalData.api.root_L;
        }
    },
    onInitialize: function(callback) {
        var that = this;
        this.globalData.callback = callback;
        let _this = this;

        wx.login({
            success: function(res) {
                _this.globalData.user_code = res.code;
                // console.log('login success...', res.code);
                wx.request({
                    url: _this.globalData.api.root + _this.globalData.api.getOpenId,
                    data: { code: _this.globalData.user_code },
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    success: function(res) {
                        // console.log("getOpenId api result: ", res.data);
                        let obj = {};
                        _this.globalData.token = res.data.token;
                        obj.openid = res.data.openid;
                        obj.expires_in = Date.now() + res.data.expires_in;
                        _this.globalData.open_id_info = obj;
                        wx.setStorageSync('openid', res.data.openid); //存储openid
                        wx.setStorageSync('session_key', res.data.session_key);
                        _this.getUserDetail(callback);
                    }
                });
            }
        });
    },
    onUnload: function() {
        this.onHide();
    },
    onHide: function() {
        // console.log("onHide function ...")
    },
    getUserDetail: function(callback) {
        let _this = this;
        _this.globalData.callback = callback;
        wx.getUserInfo({
            success: function(res) {
                // console.log("getUserInfo: ", res);
                let info = _this.globalData.userInfo;
                info.nickname = res.userInfo.nickName;
                info.avatar = res.userInfo.avatarUrl;
                info.gender = res.userInfo.gender;
                wx.request({
                    method: 'POST',
                    header: { 'content-type': 'application/json' },
                    url: _this.globalData.api.root + _this.globalData.api.addUser,
                    data: {
                        nickname: info.nickname,
                        avatar: info.avatar,
                        gender: info.gender
                    },
                    success: function(user) {
                        if (user.data.status) {
                            // console.log("add user success: ", user);
                            info.disabledState = user.data.userInfo.disabledState;
                            if (info.disabledState) {
                                wx.hideLoading();
                                wx.showModal({
                                    title: '提示',
                                    content: '您的账号已被禁用',
                                    showCancel: false,
                                    confirmText: '我知道了',
                                    // cancelText: '取消',
                                    success: function(res) {
                                        if (res.confirm) {
                                            wx.navigateBackMiniProgram({})
                                        }
                                    }
                                });
                                wx.navigateBackMiniProgram({})
                                return;
                            }
                            info.amount_pending = user.data.userInfo.amount_pending;
                            info.amount_withdraw = user.data.userInfo.amount_withdraw;
                            info.role = user.data.userInfo.role;
                            info.c_favorites = user.data.userInfo.c_favorites;
                            info.t_favorites = user.data.userInfo.t_favorites;
                            if (info.role === 1) {
                                // console.log("Organizer user ...");
                                info.organizer = true;
                                info.name = user.data.userInfo.name;
                                info.phone = user.data.userInfo.phone;
                                info.identify = user.data.userInfo.identify;
                                info.account_name = user.data.userInfo.account_name;
                                info.user_id = user.data.userInfo.user_id;
                                info.organizer_id = user.data.userInfo.id;
                            } else {
                                info.user_id = user.data.userInfo._id.toString();
                                info.organizer_id = '';
                            }
                            if (info.avatar === '') info.avatar = "/image/my/man02@2x.png"

                            if (_this.globalData.callback) _this.globalData.callback();

                        } else _this.popup_alert(user.data.message);
                    }
                })
            }
        });
        _this.getLocation(function(res) {
            var pos = {
                longitude: res.longitude,
                latitude: res.latitude
            }
            _this.getCityName(pos, function() {});
        })
    },
    go2Setting: function() {
        wx.showModal({
            title: '提示',
            content: '要正常使用此小程序，您需要允许用户位置获取权限',
            showCancel: false,
            confirmText: '去设置',
            success: function(res) {
                wx.openSetting({
                    success: (res) => {
                        // console.log("openSetting: ", res);
                    }
                });
            },
        });
    },

    getLocation: function(callback) {
        var that = this;
        wx.getLocation({
            type: 'gcj02',
            success: function(res) {
                that.globalData.searchlat = res.latitude;
                that.globalData.searchlong = res.longitude;

                if (callback) callback(res);
            }
        });
    },

    getLatLng: function(cityName, callback) {
        var that = this;
        var url = 'https://restapi.amap.com/v3/geocode/geo?key=8eb63e36d0b6d7d29a392503a4a80f6c&address=' + cityName;

        var cityData = {};

        //get activity array
        wx.request({
            url: url,
            success: function(res) {
                // console.log('got location', res.data);

                // var cityData = wx.getStorageSync('currentCity');
                var location = res.data.geocodes[0].location.split(',');
                cityData.latitude = location[1];
                cityData.longitude = location[0];
                cityData.city = cityName;
                // if (cityData.city == cityData.user_cityName) {
                //     cityData.current_latitude = cityData.user_latitude;
                //     cityData.current_longitude = cityData.user_longitude;
                // }
                that.globalData.userCityName = cityName;
                // wx.setStorageSync('currentCity', cityData);
                // var area_name = res.data.regeocode.addressComponent.district
            },
            complete: function(res) {
                if (callback) callback(cityData);
            }
        });

    },

    getCityName: function(pos, callback) {
        var that = this;
        var url = 'https://restapi.amap.com/v3/geocode/regeo?key=8eb63e36d0b6d7d29a392503a4a80f6c&location=' + pos.longitude + ',' + pos.latitude + '&poitype=&radius=&extensions=all&batch=false&roadlevel=0';

        //get activity array
        wx.request({
            url: url,
            success: function(res) {
                // console.log('got location');
                //console.log(res.data);
                that.globalData.userProvinceName = res.data.regeocode.addressComponent.province
                that.globalData.userCityName = res.data.regeocode.addressComponent.city;
                var province = that.globalData.userProvinceName
                if (province == '北京市' || province == '上海市' || province == '天津市' || province == '重庆市') {
                    that.globalData.userCityName = that.globalData.userProvinceName + '';
                    that.globalData.userProvinceName = '';
                }
                // console.log('----- Province:', that.globalData.userProvinceName, ' City:', that.globalData.userCityName)
                // var area_name = res.data.regeocode.addressComponent.district
                if (callback) callback(res.data.regeocode.addressComponent);
            },
        });
    },

    checkValidPhone: function(phone) {
        var compare = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
        return compare.test(phone);
    },
    showLoading: function() {
        wx.showLoading({ title: '加载中', });
    },
    popup_modal: function(content, title) {
        if (!title) title = '提示';
        wx.hideLoading();
        wx.showModal({
            title: '提示',
            content: content,
            // showCancel: false,
            // confirmText: '去创建',
            // cancelText: '取消',

            // success: function(res) {
            //     if (res.confirm) {
            //         wx.navigateTo({ url: '../../team/mine_team/mine_team??first=1' });
            //     }
            // }
        });
    },
    popup_alert: function(title, duration) {
        if (!title) return;
        if (!duration) duration = 3000;
        wx.hideLoading();
        wx.showModal({
            title: '提示',
            content: title,
            showCancel: false,
            confirmText: '我知道了',
            // cancelText: '取消',

            // success: function(res) {
            //     if (res.confirm) {
            //         wx.navigateTo({ url: '../../team/mine_team/mine_team??first=1' });
            //     }
            // }
        });
        // wx.showToast({
        //     title: title,
        //     icon: 'none',
        //     duration: duration
        // })
    },
    popup_notify: function(title, duration) {
        if (!title) return;
        if (!duration) duration = 3000;
        wx.hideLoading();
        wx.showToast({
            title: title,
            icon: 'success',
            duration: duration
        })
    },
    previewImg: function(img, imgRef) {
        if (!imgRef) imgRef = [img];
        if (!img) return;
        wx.previewImage({
            current: img,
            urls: imgRef,
        })
    },
    copyText2Clipboard: function(txt, callback) {
        var that = this;
        txt = txt + '';
        wx.setClipboardData({
            data: txt,
            success: function(res) {
                wx.getClipboardData({
                    success: function(res) {
                        that.popup_notify('内容已复制');
                        if (callback) callback(txt);
                    }
                })
            }
        })
    },
    phoneCall: function(phone) {
        let that = this;
        // console.log(that.checkValidPhone(phone));
        if (!that.checkValidPhone(phone)) {
            wx.showToast({
                title: '这不是有效的电话号',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        wx.makePhoneCall({ phoneNumber: phone })
    },
    makeNDigit: function(num, len) {
        num = num.toString();
        if (!len) len = 2;
        let ret = '';
        for (let i = 0; i < len; i++) ret += '0';

        ret += num;
        ret = ret.substr(-len);
        return ret;
    },
    removeDuplicated: function(arr, subKey) {
        var m = {};
        if (!subKey) subKey = '';
        var newarr = [];
        for (var i = 0; i < arr.length; i++) {
            var v = arr[i];
            if (subKey != '') v = arr[i][subKey];
            if (!m[v]) {
                newarr.push(v);
                m[v] = true;
            }
        }
        return newarr;
    },

    downloadShareImage: function(page, callback) {
        var that = this;
        var pageData = page.data.allItems;
        that.showLoading();
        //convert canvas to image file
        wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            width: pageData.shareImageWidth,
            height: pageData.shareImageHeight, // + that.data.delta,
            destWidth: pageData.shareImageWidth,
            destHeight: pageData.shareImageHeight, // + that.data.delta,
            canvasId: 'shareImg',
            success: function(res) {

                pageData.shareImagePath = res.tempFilePath;
                pageData.isShareImageShowed = true;
                page.setData({ allItems: pageData })

                ///// temporary added
                // if (callback) callback(pageData.shareImagePath);
                // return;
                /////////////////////////

                wx.saveImageToPhotosAlbum({
                    filePath: pageData.shareImagePath,
                    success(res) {
                        if (callback) callback(pageData.shareImagePath);
                    }
                })
            },
            fail: function(res) { that.popup_alert(JSON.stringify(res)); },
            complete: function() { wx.hideLoading(); }
        })
    },
});