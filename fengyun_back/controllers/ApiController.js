let request = require('request');
let config = require('../config')();
let formidable = require('formidable');
let fs = require('fs');
let path = require("path");
let BaseController = require('./BaseController');
const Organizer = require('../models/Organizer');
const User = require('../models/User');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Applying = require('../models/Applying');
const Favorite = require('../models/Favorite');
const Competition = require('../models/Competition');
const Province = require('../models/Province');
const City = require('../models/City');
const Advertise = require('../models/Advertise');
const Vote = require('../models/Vote');
const Voting = require('../models/Voting');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const Withdraw = require('../models/Withdraw');
let Notification = require('../models/Notification');

// let CCPRestSmsSDK = require('../controllers/sdk/CCPRestSmsSDK');
// var Payment = require('wechat-pay').Payment;
// var WXPay = require('weixin-pay');
const tenpay = require('tenpay');

module.exports = BaseController.extend({
    name: 'ApiController',
    getOpenId: async function (req, res, next) {
        let code = req.body.code;
        let token = '';
        if (!code) return res.send({status: false, openid: '', session_key: '', token: ''});
        let ApiId = await this.api_getOpenId(code);
        let ApiToken = await this.api_getToken(code);
        // console.log("apiId: ", ApiId, " apiToken: ", ApiToken);
        if (ApiToken.errMsg) token = ApiToken.errMsg;
        else if (ApiToken.access_token) token = ApiToken.access_token;
        return res.send({
            status: true,
            openid: ApiId.openid,
            session_key: ApiId.session_key,
            expires_in: ApiToken.expires_in,
            token: token
        })
    },
    addUser: async function (req, res, next) {
        console.log("add user api ...");
        let nickname = this.filter_nickname(req.body.nickname);
        // console.log(nickname);
        let user = await Organizer.findOne({nickname: nickname});
        if (!user) user = await User.findOne({nickname: nickname});
        if (!user) {
            let newUser = new User({
                avatar: req.body.avatar,
                nickname: nickname,
                gender: req.body.gender,
                amount_pending: 0,
                amount_withdraw: 0,
                disabledState: false,
                role: 2
            });
            user = await newUser.save();
        }
        // console.log(user);
        return res.send({status: true, userInfo: user});
    },
    addOrganizer: async function (req, res, next) {
        console.log("add organizer api ...");
        let nickname = this.filter_nickname(req.body.nickname);
        let name = req.body.name;
        let phone = req.body.phone;
        let user = await User.findOne({nickname: nickname});
        if (!user) return res.send({status: 'fail', message: '"未定义的用户！"'});
        let data = {
            user_id: user.id,
            avatar: user.avatar,
            nickname: user.nickname,
            password: "123456",
            name: name,
            phone: phone,
            account_name: "",
            amount_pending: user.amount_pending,
            amount_withdraw: user.amount_withdraw,
            disabledState: false,
            id_time: this._utc_to_local(new Date()),
            identify: 0,
            role: 1
        };
        let checkOrganizer = await Organizer.findOne({nickname: nickname});
        if (checkOrganizer) {
            await checkOrganizer.updateOne(data)
        } else {
            let organizer = new Organizer(data);
            await organizer.save();
        }
        return res.send({status: 'success', message: "成功"});
    },
    // upload image from front end
    image_upload: async function (req, res, next) {
        console.log("image upload post ...");
        let form = new formidable.IncomingForm({
            uploadDir: path.resolve("public") + '/tmp',  // don't forget the __dirname here
            keepExtensions: true
        });
        form.parse(req, function (err, fields, files) {
            let tmpPath = files.file.path;
            let ext = tmpPath.split(".").pop();
            let public_path = path.resolve('public');
            let new_folder = "/front_uploads/" + new Date().getFullYear().toString() + "_" + ((new Date()).getMonth() + 1).toString();
            let userFolderPath = public_path + new_folder;
            if (!fs.existsSync(userFolderPath)) {
                fs.mkdirSync(userFolderPath);
            }
            let image_name = new Date().getTime().toString() + Math.floor((Math.random() * 1000) + 1).toString() + '.' + ext;
            let new_full_path = userFolderPath + "/" + image_name;
            let new_path = new_folder + "/" + image_name;
            // console.log(tmpPath, new_full_path);
            fs.rename(tmpPath, new_full_path, (err) => {
                if (err) return res.send({status: 'fail', url: ''});
                return res.send({status: 'success', url: new_path});
            });
        });
    },
    add_edit_team: async function (req, res, next) {
        let that = this;
        let t_method_type = req.body.t_method_type;
        let user_id = req.body.user_id;
        if (t_method_type === 'edit_member') {
            let team_id = req.body.team_id;
            let member_ids = req.body.member_ids;
            for (let i = 0; i < member_ids.length; i++) {
                let memberItem = await Member.findOne({id: member_ids[i]});
                if (!memberItem) return res.send({status: 'fail', message: "操作失败"});
                await memberItem.updateOne({m_state: 0});
            }
            return res.send({status: 'success', message: '操作成功'});
        }
        let t_province = req.body.t_province;
        let t_city = req.body.t_city;
        if (!t_province || !t_city) return res.send({status: 'fail', message: '城市不存在'});
        let checkProvince = await Province.findOne({province: t_province});
        if (!checkProvince) return res.send({status: 'fail', message: '城市不存在'});
        let checkCity = await City.findOne({city: t_city});
        if (!checkCity) return res.send({status: 'fail', message: '城市不存在'});

        let team_data = {
            user_id: user_id,
            t_logo: req.body.t_logo,
            t_full_name: req.body.t_full_name,
            t_short_name: req.body.t_short_name,
            t_created_time: req.body.t_created_time,
            t_type: req.body.t_type,
            action_type: req.body.action_type,
            t_province: req.body.t_province,
            t_city: req.body.t_city,
            t_colors: req.body.t_colors,
            helper_name: req.body.helper_name,
            t_images: req.body.t_images,
            t_intro: JSON.stringify(req.body.t_intro),
        };
        let team_header = {
            user_id: user_id,
            m_logo: req.body.m_logo,
            m_name: req.body.m_name,
            m_phone: req.body.m_phone,
            m_gender: req.body.m_gender,
            m_id_number: req.body.m_id_number,
            m_tall: req.body.m_tall,
            m_age: req.body.m_age,
            m_pos: req.body.m_pos,
            m_number: req.body.m_number,
            m_mail: req.body.m_mail,
            m_state: 1
        };
        if (t_method_type === 'add') {
            let checkTeamFullName = await Team.findOne({t_full_name: req.body.t_full_name});
            if (checkTeamFullName) return res.send({status: 'fail', message: '您不能创建两支名称相同的球队，请修改球队名称'});
            team_data.t_members = [];
            team_data.t_state = 1;
            team_data.created_at = that._utc_to_local(new Date());
            team_data.updated_at = that._utc_to_local(new Date());
            let newTeamItem = new Team(team_data);
            let new_team = await newTeamItem.save();
            team_header.team_id = new_team.id;
            team_header.created_at = that._utc_to_local(new Date());
            team_header.updated_at = that._utc_to_local(new Date());
            let newMemberItem = new Member(team_header);
            let new_member = await newMemberItem.save();
            let t_members = new_team.t_members;
            t_members.push(new_member.id);
            await new_team.updateOne({t_members: t_members});
            return res.send({status: 'success', message: '操作成功', result: new_team.id});
        } else if (t_method_type === 'edit') {
            let team_id = req.body.team_id;
            let teamItem = await Team.findOne({id: team_id});
            if (!teamItem) return res.send({status: 'fail', message: '操作失败'});
            team_data.updated_at = that._utc_to_local(new Date());
            await teamItem.updateOne(team_data);
            let member_id = req.body.member_id;
            let memberItem = await Member.findOne({id: member_id});
            if (!memberItem) return res.send({status: 'fail', message: '操作失败'});
            team_header.updated_at = that._utc_to_local(new Date());
            await memberItem.updateOne(team_header);
            return res.send({status: 'success', message: '操作成功', result: team_id});
        } else {
            return res.send({status: 'fail', message: '操作失败'});
        }
    },
    add_edit_member: async function (req, res, next) {
        let user_id = req.body.user_id;
        let t_id = req.body.t_id;
        let member_data = {
            user_id: user_id,
            team_id: t_id,
            m_logo: req.body.m_logo,
            m_name: req.body.m_name,
            m_phone: req.body.m_phone,
            m_gender: req.body.m_gender,
            m_id_number: req.body.m_id_number,
            m_tall: req.body.m_tall,
            m_age: req.body.m_age,
            m_pos: req.body.m_pos,
            m_number: req.body.m_number,
            m_mail: req.body.m_mail
        };
        if (req.body.m_method_type === 'add') {
            member_data.m_state = 3;
            member_data.m_type = '首发';
            let checkTeam = await Team.findOne({id: t_id});
            if (checkTeam && checkTeam.user_id === user_id) member_data.m_state = 2;
            let newMemberItem = new Member(member_data);
            let new_member = await newMemberItem.save();
            let members = checkTeam.t_members;
            members.push(new_member.id);
            await checkTeam.updateOne({t_members: members});
            // add favorite
            let f_type = 1;
            let checkFav = await Favorite.findOne({f_type: f_type, user_id: user_id, fav_id: t_id});
            if (!checkFav) {
                let newFavItem = new Favorite({
                    f_type: f_type,
                    user_id: user_id,
                    fav_id: t_id,
                });
                await newFavItem.save();
            }
            // notification for add member
            let n_content = member_data.m_name + '申请加入' + checkTeam.t_full_name;
            let notification_data = {
                n_type: 6,
                n_title: '申请加入消息',
                n_content: n_content,
                n_receiver: checkTeam.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("add member notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            return res.send({status: 'success', message: '操作成功', result: new_member.id});
        } else if (req.body.m_method_type === 'edit') {
            let member_id = req.body.member_id;
            let memberItem = await Member.findOne({id: member_id});
            if (!memberItem) return res.send({status: 'fail', message: '操作失败'});
            await memberItem.updateOne(member_data);
            return res.send({status: 'success', message: '操作成功', result: member_id});
        } else {
            return res.send({status: 'fail', message: '操作失败'});
        }
    },
    allow_member: async function (req, res, next) {
        let member_id = req.body.member_id;
        let m_identify = req.body.m_identify;
        let member = await Member.findOne({id: member_id});
        let team = await Team.findOne({id: member.team_id});
        if (m_identify === 'true') {
            await member.updateOne({m_state: 2});
            // notification for applying success
            let n_content = '您已成功加入' + team.t_full_name;
            let notification_data = {
                n_type: 11,
                n_title: '成功加入球队消息',
                n_content: n_content,
                n_receiver: member.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("applying cancel notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
        } else {
            // notification for applying success
            let n_content = '很抱歉，您加入' + team.t_full_name + '的申请未能通过球队队长审核';
            let notification_data = {
                n_type: 12,
                n_title: '申请加入球队消息',
                n_content: n_content,
                n_receiver: member.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("applying cancel notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            // delete member
            await member.remove();
            let team_members = team.t_members;
            team_members.splice(team_members.findIndex(function (a) {
                return a === member_id
            }), 1);
            await team.updateOne({t_members: team_members});
        }
        return res.send({status: 'success', message: '操作成功'});
    },
    get_team_detail: async function (req, res, next) {
        let team_id = req.body.team_id;
        let user_id = req.body.user_id;
        let teamItem = await Team.aggregate([
            {$match: {id: team_id}},
            {
                '$lookup': {
                    'from': 'members',
                    'let': {'pid': '$t_members'},
                    'pipeline': [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    'as': 'members'
                }
            }
        ]);
        console.log(" ============= get team detail =================");
        // console.log(teamItem);
        if (!teamItem || teamItem.length === 0) return res.send({status: 'fail', message: '操作失败'});
        let fav_count = await Favorite.find({f_type: 1, fav_id: team_id}).countDocuments();
        let checkFav = await Favorite.findOne({user_id: user_id, fav_id: team_id, f_type: 1});
        let fav_state = false;
        if (checkFav) fav_state = true;
        // console.log("teamItem=> fav: ", fav_count, fav_state);
        return res.send({
            status: 'success',
            message: '操作成功过',
            result: teamItem[0],
            fav_state: fav_state,
            fav_count: fav_count
        });
    },
    get_member_detail: async function (req, res, next) {
        let m_id = req.body.member_id;
        // situation data should be calculated from situation of all games which is applied
        let member = await Member.aggregate([
            {$match: {id: m_id}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {
                $project: {
                    _id: 0,
                    "team._id": 0,
                    "team.t_colors": 0,
                    "team.t_images": 0,
                    "team.t_members": 0,
                    "team.t_group_name": 0,
                    "team.t_intro": 0,
                }
            }
        ]);
        if (!member.length) return res.send({status: 'fail', message: '操作失败'});
        member = member[0];
        // get member situation info
        let team = await Team.findOne({id: member.team_id});
        if (!team) return res.send({status: 'fail', message: '操作失败'});
        let games = await Game.find({g_state: 3, $or: [{g_team1: team.id}, {g_team2: team.id}]});
        let member_situation = [];
        let appear_count = 0;  // 出场数据
        for (let i = 0; i < games.length; i++) {
            let appear_flag = true;
            if (games[i].team_structure.length === 2) {
                for (let h = 0; h < 2; h++) {
                    if (!appear_flag) break;
                    for (let k = 0; k < games[i].team_structure[h].length; k++) {
                        if (games[i].team_structure[h][k][0] === m_id && games[i].team_structure[h][k][1] === '首发') {
                            appear_count += 1;
                            appear_flag = false;
                            break;
                        }
                    }
                }
            }
            for (let j = 0; j < games[i].g_situation.length; j++) {
                if (games[i].g_situation[j][0] === m_id) {
                    if (appear_flag && games[i].g_situation[j][2] === '上场') {
                        appear_count += 1;
                        appear_flag = false;
                    }
                    member_situation.push(games[i].g_situation[j]);
                }
            }
        }
        return res.send({
            status: 'success',
            result: member,
            member_situation: member_situation,
            appear_count: appear_count
        });
    },
    favorites: async function (req, res, next) {
        let user_id = req.body.user_id;
        let f_type = req.body.f_type;
        let fav_id = req.body.fav_id;
        let checkFav = await Favorite.findOne({f_type: f_type, user_id: user_id, fav_id: fav_id});
        let fav_state = false;
        if (checkFav) await checkFav.remove();
        else {
            let newFavItem = new Favorite({
                f_type: f_type,
                user_id: user_id,
                fav_id: fav_id,
            });
            await newFavItem.save();
            fav_state = true;
        }
        let fav_count = await Favorite.find({f_type: f_type, fav_id: fav_id}).countDocuments();
        return res.send({status: 'success', message: '操作成功', result: {fav_count: fav_count, fav_state: fav_state}});
    },
    get_all_competitions: async function (req, res, next) {
        let user_id = req.body.user_id;
        let competitions = await Competition.aggregate([
            {$match: {is_published: 2, c_state: {$ne: 0}}},
            {
                $lookup: {
                    from: 'applies',
                    let: {com_id: "$id"},
                    pipeline: [{
                        $match:
                            {
                                $expr:
                                    {
                                        $and:
                                            [
                                                {$eq: ["$competition_id", "$$com_id"]},
                                                {$eq: ["$user_id", user_id]}
                                            ]
                                    }
                            }
                    }
                    ],
                    as: 'applies'
                }
            },
            {
                $lookup:
                    {
                        from: 'favorites',
                        let: {c_user_id: "$user_id", c_id: "$id"},
                        pipeline: [{
                            $match:
                                {
                                    $expr:
                                        {
                                            $and:
                                                [
                                                    {$eq: ["$fav_id", "$$c_id"]},
                                                    {$eq: ["$f_type", 2]}
                                                ]
                                        }
                                }
                        }
                        ],
                        as: 'favorite'
                    }
            }
        ]);
        let cities = await Competition.aggregate([
            {$match: {is_published: 2}},
            {
                $group: {
                    _id: "$c_city",
                    count: {$sum: 1}
                }
            }
        ]);
        let newsCount = await Notification.find({n_receiver: user_id, n_state: 1}).countDocuments();
        // console.log("cities: ", cities);
        return res.send({
            status: 'success',
            result: {competitions: competitions, cities: cities, news_count: newsCount}
        });
    },
    get_competition_by_id: async function (req, res, next) {
        let competition_id = req.body.competition_id;
        let user_id = req.body.user_id;
        // console.log(competition_id, user_id);
        let competitionItem = await Competition.findOne({id: competition_id});
        if (!competitionItem) return res.send({status: 'fail', message: '操作失败'});
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: competition_id}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$team'}
        ]);
        let fav_count = await Favorite.find({f_type: 2, fav_id: competition_id}).countDocuments();
        let checkFav = await Favorite.findOne({user_id: user_id, fav_id: competition_id, f_type: 2});
        let fav_state = false;
        if (checkFav) fav_state = true;
        // console.log("competitionItem=> fav: ", fav_count, fav_state);
        return res.send({
            status: 'success', message: '操作成功过', result: competitionItem, applied_teams: applied_teams,
            fav_state: fav_state, fav_count: fav_count
        });
    },
    get_all_teams: async function (req, res, next) {
        let user_id = req.body.user_id;
        if (!user_id) return res.send({status: 'fail', message: '操作失败'});
        let all_teams = await Team.aggregate([
            {
                $lookup:
                    {
                        from: 'favorites',
                        let: {t_user_id: "$user_id", t_id: "$id"},
                        pipeline: [{
                            $match:
                                {
                                    $expr:
                                        {
                                            $and:
                                                [
                                                    {$eq: ["$fav_id", "$$t_id"]},
                                                    {$eq: ["$f_type", 1]}
                                                ]
                                        }
                                }
                        }
                        ],
                        as: 'favorite'
                    }
            },
            {
                $lookup: {
                    from: 'members',
                    let: {'pid': '$t_members'},
                    pipeline: [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    as: 'members'
                }
            }
        ]);
        let cities = await Team.aggregate([
            {
                $group: {
                    _id: "$t_city",
                    count: {$sum: 1}
                }
            }
        ]);
        let newsCount = await Notification.find({n_receiver: user_id, n_state: 1}).countDocuments();
        return res.send({status: 'success', result: {teams: all_teams, cities: cities, news_count: newsCount}});
    },
    get_teams_by_user_id: async function (req, res, next) {
        let user_id = req.body.user_id;
        let action_type = req.body.action_type;
        let teams = await Team.aggregate([
            {
                $match: {
                    t_state: 1,
                    user_id: user_id,
                    action_type: action_type
                }
            },
            {
                $lookup:
                    {
                        from: 'members',
                        localField: 'id',
                        foreignField: 'team_id',
                        as: 'members'
                    }
            }
        ]).sort({created_at: -1});
        if (!teams) return res.send({status: 'fail', message: '操作失败'});
        return res.send({status: 'success', result: teams});
    },
    add_applying: async function (req, res, next) {
        let user_id = req.body.user_id;
        if (!user_id) return res.send({status: 'fail', message: '操作失败'});
        let competition_id = req.body.competition_id;
        let competition = await Competition.findOne({id: competition_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        let team_id = req.body.team_id;
        let team = await Team.findOne({id: team_id});
        if (!team) return res.send({status: 'fail', message: '操作失败'});
        let data = {
            user_id: user_id,
            competition_id: competition_id,  // competition id
            team_id: team_id,  // team id
            a_name: req.body.a_name,
            a_phone: req.body.a_phone,
            a_state: 0,  // 0: removed, 1: pending, 2: pass, 3: non-pass
            a_reason: '',
            pay_state: 1,
            wallet_pay_price: req.body.wallet_pay_price,
            online_pay_price: req.body.online_pay_price,
            out_trade_no: req.body.out_trade_no,
            out_refund_no: '',
            created_at: this._utc_to_local(new Date()),
            updated_at: this._utc_to_local(new Date()),
        };
        // console.log(" =============================== add applying =====================");
        // console.log(data);
        if (parseFloat(data.online_pay_price) === 0) {
            data.a_state = 1;
            data.pay_state = 2;
            // notification for applying
            let organizer = await Organizer.findOne({id: competition.c_organizer_id});
            let n_content = team.t_full_name + '报名了您的' + competition.c_name + ', 请注意查看';
            let notification_data = {
                n_type: 3,
                n_title: '报名赛事消息',
                n_content: n_content,
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("applying notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            await team.updateOne({t_state: 2});
        }
        let applyingItem = new Applying(data);
        let new_applying = await applyingItem.save();
        // await team.updateOne({t_state: 2});  // this is updated on payment notify
        return res.send({status: 'success', message: 'Applying is pending', result: new_applying});
    },
    get_ads_votes: async function (req, res, next) {
        let c_id = req.body.competition_id;
        let advertises = await Advertise.find({competition_id: c_id, ad_state: 2});
        let votes = await Vote.find({competition_id: c_id, v_state: 2});
        return res.send({status: 'success', result: {advertises, votes}})
    },
    get_advertise_detail: async function (req, res, next) {
        let ad_id = req.body.ad_id;
        let advertise = await Advertise.findOne({id: ad_id});
        if (!advertise) return res.send({status: 'fail', message: '操作失败'});
        advertise.ad_read_count = advertise.ad_read_count + 1;
        advertise = await advertise.save();
        return res.send({status: 'success', result: advertise});
    },
    get_vote_details: async function (req, res, next) {
        let v_id = req.body.vote_id;
        let user_id = req.body.user_id;

        let vote = await Vote.aggregate([
            {$match: {id: v_id}},
            {
                $lookup: {
                    from: 'teams',
                    let: {'pid': '$v_teams'},
                    pipeline: [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    as: 'teams'
                }
            }
        ]);
        if (vote.length === 0) return res.send({status: 'fail', message: '操作失败'});
        vote = vote[0];
        let vote_users = await Voting.aggregate([
            {$match: {vote_id: v_id}},
            {
                $group: {
                    _id: '$user_id'
                }
            },
            {$count: 'user_vote_numbers'}
        ]);
        let team_vote_numbers = [];
        for (let i = 0; i < vote.v_teams.length; i++) {
            let team_vote_number = await Voting.find({vote_id: v_id, team_id: vote.v_teams[i]}).countDocuments();
            team_vote_numbers.push(team_vote_number);
        }
        let my_votes = await Voting.find({user_id: user_id, vote_id: v_id}, {team_id: 1, created_at: 1});
        return res.send({status: 'success', result: {vote, vote_users, team_vote_numbers, my_votes: my_votes}});
    },
    add_voting: async function (req, res, next) {
        let user_id = req.body.user_id;
        let v_id = req.body.vote_id;
        let team_id = req.body.team_id;
        if (!user_id || !v_id || !team_id) return res.send({status: 'fail', message: '操作失败'});
        let vote = await Vote.findOne({id: v_id});
        let method_type = parseInt(vote.v_method.method_type);
        let method_value = parseInt(vote.v_method.method_value);
        let voting_numbers = 0;
        console.log(method_type, method_value);
        if (method_type === 2) {
            let current_prev = this._utc_to_local(new Date());
            let current_next = this._utc_to_local(new Date());
            current_prev.setHours(0, 0, 0);
            current_next.setHours(23, 59, 0);
            let day_count = await Voting.find({
                $and: [{user_id: user_id}, {vote_id: v_id}, {created_at: {$gte: current_prev}}, {created_at: {$lte: current_next}}]
            }).countDocuments();
            console.log("d: ", day_count, method_value);
            if (day_count >= method_value) return res.send({status: 'fail', message: '今天不能投票', result: day_count});
        } else if (method_type === 1) {
            let total_count = await Voting.find({
                $and: [{user_id: user_id}, {vote_id: v_id}]
            }).countDocuments();
            console.log("1: ", total_count, method_value);
            if (total_count >= method_value) return res.send({status: 'fail', message: '已经投票', result: total_count});
        }
        let votingItem = new Voting({
            vote_id: v_id,
            user_id: user_id,
            team_id: team_id,
            v_number: 1,
            created_at: this._utc_to_local(new Date()),
            updated_at: this._utc_to_local(new Date())
        });
        await votingItem.save();
        return res.send({status: 'success', message: '操作成功'});
    },
    get_games_from_competition: async function (req, res, next) {
        let c_id = req.body.competition_id;
        let games = await Game.aggregate([
            {$match: {competition_id: c_id, g_state: {$ne: 0}}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'}
        ]);
        return res.send({status: 'success', result: games});
    },
    get_game_detail: async function (req, res, next) {
        let id = req.body.game_id;
        let game = await Game.aggregate([
            {$match: {id: id}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'},
            {
                $lookup: {
                    from: 'members',
                    let: {'pid': '$team1.t_members'},
                    pipeline: [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    as: 'members1'
                }
            },
            {
                $lookup: {
                    from: 'members',
                    let: {'pid': '$team2.t_members'},
                    pipeline: [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    as: 'members2'
                }
            }
        ]);
        if (game.length === 0) return res.send({status: 'fail', message: '操作失败'});
        game = game[0];
        let team1_id = game.g_team1;
        let team2_id = game.g_team2;
        let analyse = {id: 'dfa'};
        let an_team = await Game.aggregate([
            {
                $match: {
                    $or: [{$and: [{g_team1: team1_id}, {g_team2: team2_id}]}, {$and: [{g_team1: team2_id}, {g_team2: team1_id}]}],
                    g_state: 3
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'}
        ]);
        let an_team1 = await Game.aggregate([
            {$match: {$or: [{g_team1: team1_id}, {g_team2: team1_id}]}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'}
        ]);
        let an_team2 = await Game.aggregate([
            {$match: {$or: [{g_team1: team2_id}, {g_team2: team2_id}]}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'}
        ]);
        analyse.an_team = an_team;
        analyse.an_team1 = an_team1;
        analyse.an_team2 = an_team2;
        return res.send({status: 'success', result: {game, analyse}});
    },
    get_shooter_from_competition: async function (req, res, next) {
        let c_id = req.body.competition_id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});

        // get other situations: assist, red_card, yellow_card
        let assists = [], shooters = [], red_cards = [], yellow_cards = [];
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$team'}
        ]);
        let team_ids = [], team_member_ids = [], red_yellow_cards = [];
        for (let k = 0; k < applied_teams.length; k++) {
            team_ids.push(applied_teams[k].team_id);
            team_member_ids.push(applied_teams[k].team.t_members);
            let red_yellow_item = {
                team_id: applied_teams[k].team_id, t_full_name: applied_teams[k].team.t_full_name,
                t_short_name: applied_teams[k].team.t_short_name, red_cards: 0, yellow_cards: 0
            };
            red_yellow_cards.push(red_yellow_item);
        }
        let matched_games = await Game.aggregate([
            {$match: {competition_id: c_id, g_state: 3}},
            {$project: {'g_situation': 1, '_id': 0}},
        ]);
        let all_situations = [];
        for (let i = 0; i < matched_games.length; i++) {
            all_situations.push(...matched_games[i].g_situation);
        }
        let assist_member_ids = [];
        let s_member_ids = [];
        for (let j = 0; j < all_situations.length; j++) {
            let s_item = all_situations[j];
            let assist_item = {};
            let shooter_item = {};
            if (s_item[2] === '助攻') {
                if (assist_member_ids.indexOf(s_item[0]) === -1) {
                    assist_item.m_id = s_item[0];
                    assist_item.assists = 1;
                    assist_member_ids.push(s_item[0]);
                    assists.push(assist_item);
                } else if (assist_member_ids.indexOf(s_item[0]) !== -1) {
                    assists[assist_member_ids.indexOf(s_item[0])].assists += 1;
                }
            } else if (s_item[2] === '红牌') {
                for (let h = 0; h < team_ids.length; h++) {
                    if (team_member_ids[h].indexOf(s_item[0]) !== -1)
                        red_yellow_cards[h].red_cards += 1;
                }
            } else if (s_item[2] === '黄牌') {
                for (let h = 0; h < team_ids.length; h++) {
                    if (team_member_ids[h].indexOf(s_item[0]) !== -1)
                        red_yellow_cards[h].yellow_cards += 1;
                }
            } else if (s_member_ids.indexOf(s_item[0]) === -1 && s_item[2] === '进球') {
                shooter_item.m_id = s_item[0];
                shooter_item.total_score = 1;
                shooter_item.sub_score = 0;
                s_member_ids.push(s_item[0]);
                shooters.push(shooter_item);
            } else if (s_member_ids.indexOf(s_item[0]) === -1 && s_item[2] === '点球') {
                shooter_item.m_id = s_item[0];
                shooter_item.total_score = 0;
                shooter_item.sub_score = 1;
                s_member_ids.push(s_item[0]);
                shooters.push(shooter_item);
            } else if (s_member_ids.indexOf(s_item[0]) !== -1 && s_item[2] === '进球') {
                shooters[s_member_ids.indexOf(s_item[0])].total_score = shooters[s_member_ids.indexOf(s_item[0])].total_score + 1;
            } else if (s_member_ids.indexOf(s_item[0]) !== -1 && s_item[2] === '点球') {
                shooters[s_member_ids.indexOf(s_item[0])].sub_score = shooters[s_member_ids.indexOf(s_item[0])].sub_score + 1;
            }
        }
        // get shooter data
        // get all members from applied teams
        let members = await Member.aggregate([
            {$match: {team_id: {$in: team_ids}}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$team'}
        ]);
        if (competition.c_shooter.length !== 0) shooters = competition.c_shooter;
        for (let m_index = 0; m_index < members.length; m_index++) {
            let find_shooter_index = shooters.findIndex(function (shooter) {
                return shooter.m_id === members[m_index].id;
            });
            if (find_shooter_index !== -1) {
                shooters[find_shooter_index].m_name = members[m_index].m_name;
                shooters[find_shooter_index].m_number = members[m_index].m_number;
                shooters[find_shooter_index].t_full_name = members[m_index].team.t_full_name;
                shooters[find_shooter_index].t_short_name = members[m_index].team.t_short_name;
                shooters[find_shooter_index].t_id = members[m_index].team.id;
            }
            let find_assist_index = assists.findIndex(function (assist) {
                return assist.m_id === members[m_index].id;
            });
            if (find_assist_index !== -1) {
                assists[find_assist_index].m_name = members[m_index].m_name;
                assists[find_assist_index].m_number = members[m_index].m_number;
                assists[find_assist_index].t_full_name = members[m_index].team.t_full_name;
                assists[find_assist_index].t_short_name = members[m_index].team.t_short_name;
                assists[find_assist_index].t_id = members[m_index].team.id;
            }
        }

        return res.send({status: 'success', result: shooters, assists: assists, red_yellow_cards: red_yellow_cards});
    },
    get_games_from_team: async function (req, res, next) {
        let t_id = req.body.team_id;
        let games = await Game.aggregate([
            {$match: {$or: [{g_team1: t_id}, {g_team2: t_id}]}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team1',
                    foreignField: 'id',
                    as: 'team1'
                }
            },
            {$unwind: '$team1'},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'g_team2',
                    foreignField: 'id',
                    as: 'team2'
                }
            },
            {$unwind: '$team2'},
        ]);
        return res.send({status: 'success', result: games});
    },
    get_competitions_by_user: async function (req, res, next) {
        let user_id = req.body.user_id;
        let organizer = await Organizer.findOne({user_id: user_id, identify: {$in: [0, 1]}});
        let competitions = [];
        if (organizer) {
            competitions = await Competition.aggregate([
                {$match: {c_organizer_id: organizer.id}},
                {
                    $lookup: {
                        from: 'applies',
                        let: {com_id: "$id"},
                        pipeline: [{
                            $match:
                                {
                                    $expr:
                                        {
                                            $and:
                                                [
                                                    {$eq: ["$competition_id", "$$com_id"]},
                                                    {$eq: ["$user_id", user_id]}
                                                ]
                                        }
                                }
                        }
                        ],
                        as: 'applies'
                    }
                }
            ]);
        } else {
            // get teams
            let members = await Member.aggregate([
                {$match: {user_id: user_id, m_state: {$ne: 0}}}
            ]);
            // get team ids as unique
            let team_ids = [];
            for (let i = 0; i < members.length; i++) {
                if (team_ids.indexOf(members[i].team_id) === -1) team_ids.push(members[i].team_id);
            }
            let competition_ids = [];
            for (let j = 0; j < team_ids.length; j++) {
                let applies = await Applying.aggregate([
                    {$match: {team_id: team_ids[j], a_state: {$ne: 0}}}
                ]);
                for (let k = 0; k < applies.length; k++) {
                    if (competition_ids.indexOf(applies[k].competition_id) === -1) competition_ids.push(applies[k].competition_id);
                }
            }
            for (let com_index = 0; com_index < competition_ids.length; com_index++) {
                let competition = await Competition.findOne({id: competition_ids[com_index]});
                if (competition) competitions.push(competition);
            }
        }
        return res.send({status: 'success', result: competitions});
    },
    get_teams_by_user: async function (req, res, next) {
        let user_id = req.body.user_id;
        // get all members
        let members = await Member.aggregate([
            {$match: {user_id: user_id}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$team'},
            {
                $group: {
                    _id: '$team.id',
                    teams: {$push: '$team'}
                }
            }
        ]);
        return res.send({status: 'success', result: members});
    },
    get_favorite_com_team: async function (req, res, next) {
        let user_id = req.body.user_id;
        let competitions = await Favorite.aggregate([
            {$match: {user_id: user_id, f_type: 2}},
            {
                $lookup: {
                    from: 'competitions',
                    localField: 'fav_id',
                    foreignField: 'id',
                    as: 'competition'
                }
            },
            {$unwind: '$competition'},
            {
                $project: {
                    '_id': 0,
                    'competition': 1
                }
            }
        ]);
        let teams = await Favorite.aggregate([
            {$match: {user_id: user_id, f_type: 1}},
            {
                $lookup: {
                    from: 'teams',
                    localField: 'fav_id',
                    foreignField: 'id',
                    as: 'team'
                }
            },
            {$unwind: '$team'},
            {
                $project: {
                    '_id': 0,
                    'team': 1
                }
            }
        ]);
        let fav_count = [];
        for (let i = 0; i < teams.length; i++) {
            fav_count.push(await Favorite.find({f_type: 1, fav_id: teams[i].team.id}).countDocuments());
        }
        return res.send({status: 'success', result: {competitions, teams, fav_count}});
    },
    get_rankings: async function (req, res, next) {
        let c_id = req.body.competition_id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        let c_type = parseInt(competition.c_type);
        let applied_teams = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "id",
                    as: "team"
                }
            },
            {$unwind: "$team"}
        ]);
        let applied_team_ids = [];
        let applied_team_names = [];
        for (let i = 0; i < applied_teams.length; i++) {
            applied_team_ids.push(applied_teams[i].team_id);
            applied_team_names.push(applied_teams[i].team.t_full_name);
        }
        let games = [];
        let rankings = [];
        if (competition.c_type === 1 || competition.c_type === 2) {
            let one_group = {group_name: 'none', group_data: []};
            for (let j = 0; j < applied_team_ids.length; j++) {
                let ranking = {group_name: 'none'};
                ranking.team_id = applied_team_ids[j];
                let total_count = 0, win_count = 0, draw_count = 0, lose_count = 0, win_score = 0, lose_score = 0;
                let games1 = await Game.aggregate([
                    {$match: {g_team1: applied_team_ids[j], g_type: 1, g_state: {$in: [1, 2, 3]}}}
                ]);
                let games2 = await Game.aggregate([
                    {$match: {g_team2: applied_team_ids[j], g_type: 1, g_state: {$in: [1, 2, 3]}}}
                ]);
                if (games1.length === 0 && games2.length === 0) continue;
                for (let k = 0; k < games1.length; k++) {
                    if (games1[k].team1_total_score == null || games1[k].team2_total_score == null) continue;
                    if (games1[k].team1_total_score > games1[k].team2_total_score) win_count += 1;
                    else if (games1[k].team1_total_score < games1[k].team2_total_score) lose_count += 1;
                    else if (games1[k].team1_total_score === games1[k].team2_total_score) draw_count += 1;
                    win_score += parseInt(games1[k].team1_total_score);
                    lose_score += parseInt(games1[k].team2_total_score);
                    total_count += 1;
                }
                for (let k = 0; k < games2.length; k++) {
                    if (games2[k].team1_total_score == null || games2[k].team1_total_score === undefined
                        || games2[k].team2_total_score == null || games2[k].team2_total_score === undefined) continue;
                    if (games2[k].team1_total_score < games2[k].team2_total_score) win_count += 1;
                    else if (games2[k].team1_total_score > games2[k].team2_total_score) lose_count += 1;
                    else if (games2[k].team1_total_score === games2[k].team2_total_score) draw_count += 1;
                    win_score += parseInt(games2[k].team2_total_score);
                    lose_score += parseInt(games2[k].team1_total_score);
                    total_count += 1;
                }
                ranking.total_count = total_count;
                ranking.win_count = win_count;
                ranking.draw_count = draw_count;
                ranking.lose_count = lose_count;
                ranking.win_score = win_score;
                ranking.lose_score = lose_score;
                one_group.group_data.push(ranking);
            }
            rankings.push(one_group);
        } else if (competition.c_type === 3 || competition.c_type === 4) {
            let game_groups = await Game.aggregate([
                {$match: {competition_id: c_id, g_state: {$in: [1, 2, 3]}, g_type: 2}},
                {
                    $group: {
                        _id: '$group_name',
                        games: {$push: '$$ROOT'}
                    }
                }
            ]);
            for (let k = 0; k < game_groups.length; k++) {
                let group_name = game_groups[k]._id;
                let group_games = game_groups[k].games;
                if (group_games.length === 0) continue;
                let group_team_ids = [];
                let group_ranking = {group_name: group_name, group_data: []};
                for (let i = 0; i < group_games.length; i++) {
                    let game = group_games[i];
                    // if (game.team1_total_score == null || game.team2_total_score == null) continue;
                    let index1 = group_team_ids.indexOf(game.g_team1);
                    let index2 = group_team_ids.indexOf(game.g_team2);
                    if (index1 === -1) {
                        group_team_ids.push(game.g_team1);
                        let new_ranking1 = {
                            group_name: group_name, team_id: game.g_team1, total_count: 1, win_count: 0, draw_count: 0,
                            lose_count: 0, win_score: game.team1_total_score, lose_score: game.team2_total_score
                        };
                        if (game.team1_total_score == null || game.team2_total_score == null) new_ranking1.total_count = 0;
                        else if (game.team1_total_score > game.team2_total_score) new_ranking1.win_count = 1;
                        else if (game.team1_total_score < game.team2_total_score) new_ranking1.lose_count = 1;
                        else if (game.team1_total_score === game.team2_total_score) new_ranking1.draw_count = 1;
                        group_ranking.group_data.push(new_ranking1);
                    } else {
                        group_ranking.group_data[index1].win_score += game.team1_total_score;
                        group_ranking.group_data[index1].lose_score += game.team2_total_score;
                        group_ranking.group_data[index1].total_count += 1;
                        if (game.team1_total_score == null || game.team2_total_score == null) group_ranking.group_data[index1].total_count -= 1;
                        else if (game.team1_total_score > game.team2_total_score) group_ranking.group_data[index1].win_count += 1;
                        else if (game.team1_total_score < game.team2_total_score) group_ranking.group_data[index1].lose_count += 1;
                        else if (game.team1_total_score === game.team2_total_score) group_ranking.group_data[index1].draw_count += 1;
                    }
                    if (index2 === -1) {
                        group_team_ids.push(game.g_team2);
                        let new_ranking2 = {
                            group_name: group_name, team_id: game.g_team2, total_count: 1, win_count: 0, draw_count: 0,
                            lose_count: 0, win_score: game.team2_total_score, lose_score: game.team1_total_score
                        };
                        if (game.team1_total_score == null || game.team2_total_score == null) new_ranking2.total_count = 0;
                        else if (game.team1_total_score < game.team2_total_score) new_ranking2.win_count = 1;
                        else if (game.team1_total_score > game.team2_total_score) new_ranking2.lose_count = 1;
                        else if (game.team1_total_score === game.team2_total_score) new_ranking2.draw_count = 1;
                        group_ranking.group_data.push(new_ranking2);
                    } else {
                        group_ranking.group_data[index2].win_score += game.team2_total_score;
                        group_ranking.group_data[index2].lose_score += game.team1_total_score;
                        group_ranking.group_data[index2].total_count += 1;
                        if (game.team1_total_score == null || game.team2_total_score == null) group_ranking.group_data[index2].total_count -= 1;
                        else if (game.team1_total_score < game.team2_total_score) group_ranking.group_data[index2].win_count += 1;
                        else if (game.team1_total_score > game.team2_total_score) group_ranking.group_data[index2].lose_count += 1;
                        else if (game.team1_total_score === game.team2_total_score) group_ranking.group_data[index2].draw_count += 1;
                    }
                }
                rankings.push(group_ranking);
            }
        }
        for (let m = 0; m < rankings.length; m++) {
            for (let n = 0; n < rankings[m].group_data.length; n++) {
                let get_t_full_name = await Team.findOne({id: rankings[m].group_data[n].team_id});
                if (!get_t_full_name) continue;
                rankings[m].group_data[n].t_full_name = get_t_full_name.t_full_name;
                rankings[m].group_data[n].t_short_name = get_t_full_name.t_short_name;
            }
        }
        rankings = rankings.sort(function (a, b) {
            return a.group_name > b.group_name ? 1 : -1;
        });
        if (c_type === 3 || c_type === 4 || c_type === 5) {
            games = await Game.aggregate([
                {$match: {competition_id: c_id, g_type: 3}},
                {
                    $lookup: {
                        from: 'teams',
                        localField: 'g_team1',
                        foreignField: 'id',
                        as: 'team1'
                    }
                },
                {$unwind: '$team1'},
                {
                    $lookup: {
                        from: 'teams',
                        localField: 'g_team2',
                        foreignField: 'id',
                        as: 'team2'
                    }
                },
                {$unwind: '$team2'},
            ]);
        }
        return res.send({status: 'success', result: {games, rankings}});
    },
    get_notifications: async function (req, res, next) {
        let user_id = req.body.user_id;
        let notifications = await Notification.find({n_receiver: user_id}).sort({created_at: -1});
        for (let i = 0; i < notifications.length; i++) {
            await notifications[i].updateOne({n_state: 2});
        }
        return res.send({status: 'success', result: notifications});
    },
    get_transactions: async function (req, res, next) {
        let user_id = req.body.user_id;
        let trans = await Transaction.aggregate([
            {$match: {user: user_id}},
            {
                $lookup: {
                    from: 'competitions',
                    localField: 'competition_id',
                    foreignField: 'id',
                    as: 'competition'
                }
            }
        ]).sort({created_at: -1});
        return res.send({status: 'success', result: trans});
    },
    get_withdraws: async function (req, res, next) {
        let user_id = req.body.user_id;
        let withdraws = await Withdraw.find({user: user_id, w_state: 2}).sort({updated_at: -1});
        return res.send({status: 'success', result: withdraws});
    },


    // weixin api requests
    api_getOpenId: function (code) {
        console.log("request get open id ...");
        let url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + config.app.id + "&secret=" + config.app.secret +
            "&js_code=" + code + "&grant_type=authorization_code";
        let options = {
            url: url,
            method: "GET",
            json: {}
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (err) reject(err);
                try {
                    resolve(body)
                } catch (e) {
                    reject(e)
                }
            })
        })
    },
    api_getToken: function (code) {
        console.log("request get token ...");
        let url = "https://api.weixin.qq.com/cgi-bin/token?appid=" + config.app.id + "&secret=" + config.app.secret +
            "&js_code=" + code + "&grant_type=client_credential";
        let options = {
            url: url,
            method: "GET",
            json: {}
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (err) reject(err);
                try {
                    resolve(body)
                } catch (e) {
                    reject(e)
                }
            })
        })
    },

    api_withdraw_order: async function (req, res, next) {
        let that = this;
        console.log("=========== weixin withdraw request ================");
        console.log(req.body);
        let user_id = req.body.user_id;
        let organizer = await Organizer.findOne({user_id: user_id});
        if (!organizer) return res.send({status: 'fail', message: 'Unknown Organizer'});
        let amount = parseFloat(req.body.fee);
        let partner_trade_no = req.body.partner_trade_no;
        let withdraw_data = {
            partner_trade_no: partner_trade_no,
            openid: req.body.open_id,
            re_user_name: req.body.user_name,
            check_name: 'NO_CHECK',
            amount: parseInt(amount * 98),
            desc: '蜂云赛事信息',
            spbill_create_ip: req.ip,
        };
        // withdraw api
        let result = await this.weixin_withdraw(withdraw_data);
        console.log("end withdraw");
        // make new withdraw transaction
        if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
            let withdrawItem = new Withdraw({
                user: user_id,
                amount: amount,
                partner_trade_no: partner_trade_no,
                w_state: 2,
                created_at: that._utc_to_local(new Date()),
                updated_at: that._utc_to_local(new Date()),
            });
            await withdrawItem.save();
            console.log('===== update organizer wallet from withdraw =====');
            let new_wallet = organizer.amount_withdraw - amount;
            await organizer.updateOne({amount_withdraw: new_wallet});
            // notification for withdraw
            let n_content = '您的提现已经到账，请注意查看您的微信钱包';
            let notification_data = {
                n_type: 4,
                n_title: '提现成功消息',
                n_content: n_content,
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: that._utc_to_local(new Date()),
                updated_at: that._utc_to_local(new Date()),
            };
            console.log("withdraw notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            // transaction for withdraw
            let trans_data = {
                user: user_id,
                amount: amount,
                type: 3,
                competition_id: 'none',
                apply_id: 'none',
                created_at: that._utc_to_local(new Date()),
                updated_at: that._utc_to_local(new Date())
            };
            console.log("===== new transaction data =====");
            let newTrans = new Transaction(trans_data);
            await newTrans.save();
            return res.send({status: 'success', result: ''});
        } else {
            // notification for withdraw
            let n_content = '很抱歉，提现失败，请稍后重试';
            let notification_data = {
                n_type: 5,
                n_title: '提现失败消息',
                n_content: n_content,
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("withdraw notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
        }

    },
    api_weixin_order: async function (req, res, next) {
        console.log("=========== weixin order request ================");
        console.log(req.body);
        let order_data = {
            out_trade_no: req.body.out_trade_no,
            body: req.body.body,
            total_fee: parseFloat(req.body.total_fee) * 100,
            openid: req.body.open_id
        };
        let result = await this.weixin_order(order_data);
        return res.send({status: 'success', result: result});
    },
    notify_url_func: async function (req, res, next) {
        let that = this;
        let info = req.weixin;
        console.log("===== weixin notify url =====", info);
        let out_trade_no = info.out_trade_no;
        if (info.result_code !== 'SUCCESS' || info.return_code !== 'SUCCESS') {
            let apply = await Applying.findOne({out_trade_no: out_trade_no, pay_state: 1});
            if (apply) {
                let team = await Team.findOne({id: apply.team_id});
                await apply.updateOne({pay_state: 3, a_state: 0});
                await team.updateOne({t_state: 1});
            }
            return res.reply('notify fail');
        }
        let apply = await Applying.findOne({out_trade_no: out_trade_no, pay_state: 1});
        if (!apply) {
            console.log('=== withdraw notify_url ===');
            return res.reply('withdraw success');
        }
        let team = await Team.findOne({id: apply.team_id});
        let a_state = apply.a_state;
        if (a_state === 0) {
            console.log('applying notify url ...');
            let amount = apply.online_pay_price;
            let transItem = new Transaction({
                user: apply.user_id,
                amount: amount,
                type: 1,
                competition_id: apply.competition_id,
                apply_id: apply.id,
                created_at: that._utc_to_local(new Date()),
                updated_at: that._utc_to_local(new Date()),
            });
            await transItem.save();
            await apply.updateOne({a_state: 1, pay_state: 2});
            await team.updateOne({t_state: 2});
            // update user wallet
            let competition = await Competition.findOne({id: apply.competition_id});
            let organizer = await Organizer.findOne({id: competition.c_organizer_id});
            let organizer_wallet = organizer.amount_pending + amount;
            await organizer.updateOne({amount_pending: organizer_wallet});
            // notification for applying
            let n_content = team.t_full_name + '报名了您的' + competition.c_name + ', 请注意查看';
            let notification_data = {
                n_type: 3,
                n_title: '报名赛事消息',
                n_content: n_content,
                n_receiver: organizer.user_id,
                n_state: 1,
                created_at: this._utc_to_local(new Date()),
                updated_at: this._utc_to_local(new Date()),
            };
            console.log("applying notification: ", notification_data);
            let notification_item = new Notification(notification_data);
            await notification_item.save();
            return res.reply('applying payment success');
        }
    },
});