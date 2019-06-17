/*
 fileName:
 description: process Tourist Area
 */

// Code included inside $( document ).ready() will only run once the page Document Object Model (DOM) is ready for JavaScript code to execute

var uploadCrop;
var uploadCropCover;
$(document).ready(function () {
    uploadCrop = $("#upload-origin").croppie({
        enableExif: true,
        viewport: {
            width: 250,
            height: 250,
            type: 'rectangle'
        },
        boundary: {
            width: 400,
            height: 400
        }
    });
    uploadCropCover = $("#upload-origin-cover").croppie({
        enableExif: true,
        viewport: {
            width: 528,
            height: 816,
            type: 'rectangle'
        },
        boundary: {
            width: 600,
            height: 900
        }
    });
});

$('#upload-crop').on('change', function () {
    var reader = new FileReader();
    var type = this.files[0]['type'];
    if (type != 'image/png' && type != 'image/jpeg') {
        alert("图片格式不正确, 请选择 jpg, jpeg, png 格式");
        return;
    }
    reader.onload = function (e) {
        uploadCrop.croppie('bind', {
            url: e.target.result
        }).then(function () {
            console.log('jQuery bind complete');
            refreshTargetImg();
        });

    };
    reader.readAsDataURL(this.files[0]);
});

$('#upload-origin').on('mouseup', function () {
    refreshTargetImg();
});

function refreshTargetImg() {
    uploadCrop.croppie('result', {
        type: 'canvas',
        size: 'viewport'
    }).then(function (resp) {
        // html = '<img id="uploaded-data" src="' + resp + '" style="width:100%; height:100%; "/>';
        $(".competition-logo-image img").attr("src", resp);
    });
}
