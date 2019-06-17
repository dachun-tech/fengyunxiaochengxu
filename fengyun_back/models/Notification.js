let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let NotificationSchema = new Schema({
    id: String,
    n_type: Number,  // 1 ~ 14
    n_title: String,
    n_content: String,
    n_receiver: String,  // user_id
    n_state: Number,  // 1: unread, 2: read
    created_at: Date,
    updated_at: Date,
});
// Event
NotificationSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('notifications', NotificationSchema);
