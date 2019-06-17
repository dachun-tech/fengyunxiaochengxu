let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let CompetitionSchema = new Schema({
    id: String,
    c_organizer_id: String,
    c_logo: String,
    c_active_type: Number,  // 1: 足球
    c_name: String,
    c_system: Number,  // competition system(how many persons will be added)
    c_season: String,
    c_type: Number,     // 1: league(single), 2: league(double), 3: group(single), 4: group(double), 5: cup
    c_start_time: String,
    c_end_time: String,
    c_applying_start_time: String,
    c_applying_end_time: String,
    c_fee: Number,
    c_payment_type: Number,  // 1: wechat payment, 2: offline payment
    c_place: String,
    c_province: Object,
    c_city: Object,
    c_organizer: Array,
    c_organizer_phone: String,
    c_manager: Array,
    c_cooperator: Array,
    c_helper: Array,
    c_helper_images: Array,
    c_intro_competition: String,
    c_intro_progress: String,
    c_intro_helper: String,
    is_published: Number,  // 1: un-publish 2: publish
    c_order: Number,  // recommend by admin 1: recommended, 2: general
    c_state: Number,  // 0: removed, 1:created, 2:start applying, 3:end applying, 4: start competition, 5:end competition,
                        // 6: applying opened in backend, 7: applying stopped in backend
    c_shooter: Array,  // shooter management(m_name, m_number, t_full_name, total_score, sub_score, [order], system_data(false, true))
    c_ranking: Array,  // ranking management
            // c_type: 1,2 : group_name="none", t_name(team_id), total_count, win_count, draw_count, lose_count, win_score, lose_score
            // c_type: 3,4: group_name="A", -- // -- , [c_type: 5: don't exist]
    created_at: Date,
    updated_at: Date,
});
// Events
CompetitionSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('competitions', CompetitionSchema);