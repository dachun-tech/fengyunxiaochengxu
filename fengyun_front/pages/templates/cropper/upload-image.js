const app = getApp();
Page({
    data: {
        src: '',
        width: 250, //宽度
        height: 250, //高度
    },
    onLoad: function(options) {
        var that = this;
        //获取到image-cropper对象
        that.cropper = that.selectComponent("#image-cropper");
        //开始裁剪 
        wx.chooseImage({
            count: 1,
            success: function(resp) {
                // console.log(resp);
                var img_filePath = resp.tempFilePaths[0];
                that.setData({
                    src: img_filePath,
                });
            },
        });
        // wx.showLoading({
        //     title: '加载中'
        // })
    },
    cropperload(e) {
        // console.log("cropper初始化完成");
    },
    loadimage(e) {
        // console.log("图片加载完成", e.detail);
        wx.hideLoading();
        //重置图片角度、缩放、位置
        this.cropper.imgReset();
    },
    clickcut(e) {
        // console.log(e.detail);
        //点击裁剪框阅览图片
        app.globalData.tempUploadImage = e.detail.url;
        app.globalData.ischooseimage = 1;
        if (app.globalData.selectImageCallBack) app.globalData.selectImageCallBack(e.detail.url);
        wx.navigateBack({ delta: 1 });
        return;
        wx.previewImage({
            current: e.detail.url, // 当前显示图片的http链接
            urls: [e.detail.url] // 需要预览的图片http链接列表
        })
    },
    onclick_button(e) {
        var type = e.currentTarget.dataset.type;
        var that = this.cropper;

        switch (type) {
            case 'finishEdit':
                that._draw(() => {
                    wx.canvasToTempFilePath({
                        width: that.data.width * that.data.export_scale,
                        height: Math.round(that.data.height * that.data.export_scale),
                        destWidth: that.data.width * that.data.export_scale,
                        destHeight: Math.round(that.data.height) * that.data.export_scale,
                        fileType: 'png',
                        quality: that.data.quality,
                        canvasId: that.data.el,
                        success: (res) => {
                            that.triggerEvent('tapcut', {
                                url: res.tempFilePath,
                                width: that.data.width * that.data.export_scale,
                                height: that.data.height * that.data.export_scale
                            });
                        }
                    }, that);
                });
                break;
            case 'selectImage':
                that.upload();
                break;
        }

    },

})