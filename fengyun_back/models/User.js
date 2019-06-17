let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let UserSchema = new Schema({
    id: String,
    avatar: String,
    nickname: String,
    gender: Number,
    amount_pending: Number,
    amount_withdraw: Number,
    disabledState: Boolean,
    role: Number,       // 0: admin, 1: organizer, 2: users
});
// Events
UserSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('users', UserSchema);
