Page({
    data: { site: '' },
    onLoad: function(option) {
        var site = option.id;
        if (site.indexOf('http') < 0) site = 'http://' + site;
        this.setData({ site: site });
    },
});