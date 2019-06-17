Page({
    data: {
        flag: true
    },
    onShow: function () {
        this.goFengQuBa();
    },
    goFengQuBa: function () {
        let _this = this;
        wx.navigateToMiniProgram({
            appId: 'wxea381fb0ca7c2a24',
            path: 'pages/index/index',
            extraData: {},
            // envVersion: 'develop',
            success(res) {
            },
            fail(res) {
                wx.switchTab({
                    url: "/pages/profile/index/index"
                })
            }
        })
    }
});