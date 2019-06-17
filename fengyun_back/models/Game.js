let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let GameSchema = new Schema({
    id: String,
    competition_id: String,
    group_name: String,  // A, B, ... if 小组赛 (when c_type: 3, 4),
    g_round: Number,  // when c_type: 1,2,3,4
    g_stage: String,  // when c_type: 5
    g_stage_order: Number,  // when c_type: 5, 1:决赛, 2:半决赛, 3:1/4决赛, 4:1/8决赛, 5:1/16决赛, ...
    g_date: String,
    g_time: String,
    g_team1: String,  // team_id
    g_team2: String,  // team id
    team1_total_score: Number,
    team1_sub_score: Number,
    team2_total_score: Number,
    team2_sub_score: Number,
    g_place: String,
    team_structure: Array,  // length should 2(已编辑), first array if for team1 structure, second is for team2 structure, if length is 0, non-set
    g_situation: Array,  // if length is 0, non-set. set(已编辑) one array[member_id(team id is included in member info), value, situation]
    g_state: Number,  // 0: removed, 1: 未开赛, 2: 待更新结果, 3: 已结束
    g_stream: String,  // live stream url
    g_type: Number,  // 1: federation, 2: group-federation, 3: non-federation
});
// Events
GameSchema.pre('save', function (next) {
    this.id = this._id.toString();
    next();
});

module.exports = mongoose.model('games', GameSchema);