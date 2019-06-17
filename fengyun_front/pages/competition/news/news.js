// pages/index/news/news.js
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        title: [
            '评价消息', // 0
            '提现到账消息', // 1
            '提现失败消息', // 2
            '报名蜂约消息', // 3
            '取消蜂约消息', // 4
            '收取蜂蜜消息', // 5
            '认证成功', // 6
            '认证失败', // 7
            '取消蜂约退款', // 8
            '活动提醒消息', // 9
            '取消蜂约消息', // 10
            '取消蜂约退款', // 11
            '取消订单消息', // 12
            '报名赛事消息', // 13
            '订单成功通知', // 14
            '报名活动消息', // 15
            '订单成功通知', // 16
            '取消订单退款', // 17
            '取消订单通知', // 18
            '蜂友解除通知', // 19
            '蜂友添加申请', // 20
            '团购成功通知', // 21
            '团购成功通知', // 22
            '团购取消通知', // 23
            '团购取消通知', // 24
            '取消团购退款', // 25
        ],
        eventData: [],

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        app.showLoading();
        wx.request({
            url: app.globalData.api.root + app.globalData.api.getNotifications,
            data: { user_id: app.globalData.userInfo.user_id },
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function(res) {
                var newsarray = res.data.result;

                if (res.data.status == 'success') {

                    var now = Date.now()

                    for (var i = 0; i < newsarray.length; i++) {
                        var item = newsarray[i];
                        var newsTime = item.created_at;
                        newsTime = newsTime.replace(/T/g, ' ');
                        newsTime = newsTime.replace(/-/g, '/');
                        newsTime = newsTime.split('.')[0];
                        var tempdate = Date.parse(newsTime);

                        // console.log(now - tempdate);

                        if (now - tempdate < 120000) {
                            item.submit_time = "刚刚"
                        } else if (now - tempdate < 3600000) {
                            var minute = (now - tempdate) / 60000
                            minute = Math.floor(minute)
                            item.submit_time = minute + "分钟前"
                        } else if (now - tempdate < 86400000) {
                            var hour = (now - tempdate) / 3600000
                            hour = Math.floor(hour)
                            item.submit_time = hour + "小时前"
                        } else if (now - tempdate < 172800000) {
                            item.submit_time = "昨天"
                        } else {
                            newsTime = newsTime.replace(/\//g, '-');
                            item.submit_time = newsTime;
                        }
                    }
                    that.setData({ newsarray: newsarray })

                } else app.popup_alert(res.data.message);

            },
            complete: function() { wx.hideLoading(); }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

})