//index.js
//获取应用实例
const app = getApp()

Page({
    data: {
        image_cancel_success_src: '../../../images/success@2x.png',
        kind: 4,
        id: 0,
        cancel_sucess_text: ["提交成功，钱款将在1-3个工作日到账", "取消成功，钱款将在1-3个工作日退回", "报名成功", "报名成功", "报名成功"],
        title_text: ["提交成功", "取消成功", "活动报名", "我的订单", "赛事报名"],
    },
    onLoad: function(option) {
        var that = this;
        if (!option.type) option.type = 4;
        this.setData({
            kind: option.type,
            id: option.id
        })
        if (option.event != undefined)
            that.data.event = option.event;
        wx.setNavigationBarTitle({
            title: that.data.title_text[parseInt(option.type)]
        })

    },
    on_return: function() {
        app.onInitialize();
        var that = this;
        switch (that.data.kind) {
            case 4:
                wx.navigateBack({
                    delta: 1,
                    // url: '../detail_competition/detail_competition?id=' + that.data.id,
                })
                break;
            case 5:
                wx.switchTab({
                    url: '../index/index',
                })
                break;
            case 0:
                wx.redirectTo({ // activity booking
                    url: '../../index/detail_event/detail_event?id=' + that.data.event,
                })
                break;
        }
    }
})