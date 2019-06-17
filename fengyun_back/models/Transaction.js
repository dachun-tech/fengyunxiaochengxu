let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let TransactionSchema = new Schema({
    id: String,
    user: String, // payer user id
    amount: Number,
    type: Number,  // 1: applying, 2: cancel_applying, 3: withdraw,
    competition_id: String,
    apply_id: String,
    created_at: Date,
    updated_at: Date
});
// event
TransactionSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('transactions', TransactionSchema);