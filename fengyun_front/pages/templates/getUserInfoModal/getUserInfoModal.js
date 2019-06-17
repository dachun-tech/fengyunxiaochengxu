let app = getApp();
Page({
    getUserModalHide: function () {
        app.globalData.getInit = true;
        wx.navigateBack({delta: 1})
    }
});