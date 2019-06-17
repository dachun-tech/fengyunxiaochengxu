let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MemberSchema = new Schema({
    id: String,
    user_id: String,
    team_id: String,
    m_logo: String,
    m_name: String,
    m_phone: String,
    m_gender: String,
    m_id_number: String,
    m_tall: Number,
    m_age: Number,
    m_type: String,  // 首发,  替补
    m_pos: String,  // 前锋, 中场, 后卫, 守门员
    m_number: Number,
    m_mail: String,
    m_state: Number,  // 0: removed from team, 1: team header, 2: general member, 3: 审核中
    created_at: Date,
    updated_at: Date,
});
// Events
MemberSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('members', MemberSchema);
