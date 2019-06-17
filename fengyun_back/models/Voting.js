let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let VotingSchema = new Schema({
    id: String,
    vote_id: String,
    user_id: String,
    team_id: String,
    v_number: Number,
    created_at: Date,
    updated_at: Date,
});

// event
VotingSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('votings', VotingSchema);
