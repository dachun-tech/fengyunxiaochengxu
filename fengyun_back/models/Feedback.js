let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let FeedbackSchema = new Schema({
    id: String,
    organizer_id: String,
    email: String,
    content: String,
    state: Number,  // 1: unread, 2: read
    created_at: Date,
    updated_at: Date,
});

// Event
FeedbackSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('feedbacks', FeedbackSchema);
