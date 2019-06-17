let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let AdvertiseSchema = new Schema({
    id: String,
    organizer_id: String,
    ad_title: String,
    competition_id: String,  // competition id
    ad_poster_name: String,
    ad_intro: String,
    ad_post_time: Date,
    ad_state: Number,  // 0: removed, 1: un-publish, 2: publish
    ad_read_count: Number,
    created_at: Date,
    updated_at: Date,
});
// event
AdvertiseSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('advertises', AdvertiseSchema);