let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let TeamSchema = new Schema({
    id: String,
    user_id: String,
    t_logo: String,
    t_full_name: String,
    t_short_name: String,
    t_created_time: String,
    t_type: String,  //  俱乐部, 球队, 学校, 协会
    action_type: Number,  // 1: 足球, 2: 篮球
    t_province: String,
    t_city: String,
    t_colors: Array,  // max is 2 colors
    helper_name: String,
    t_images: Array,
    t_intro: String,
    t_members: Array,  // member id
    t_state: Number,  // 1: non-used, 2: used
    t_group_name: String,  // A, B...
    created_at: Date,
    updated_at: Date,
});
// Events
TeamSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('teams', TeamSchema);