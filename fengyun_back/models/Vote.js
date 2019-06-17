let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let VoteSchema = new Schema({
    id: String,
    organizer_id: String,
    v_title: String,
    competition_id: String,  // competition id
    v_start_time: Date,
    v_end_time: Date,
    v_method: Object,  // {method_type: 1, 2, method_text: 每个微信号一共可以投, 每个微信号每天可以投, method_value: number}
    v_images: Array,
    v_intro: String,
    v_teams: Array,  // team ids
    v_state: Number,   // 0: removed, 1: un-published, 2: published
    created_at: Date,
    updated_at: Date,
});
// Events
VoteSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('votes', VoteSchema);
