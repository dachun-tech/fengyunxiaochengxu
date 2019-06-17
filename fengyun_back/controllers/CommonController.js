let BaseController = require('./BaseController');
let FroalaEditor = require('wysiwyg-editor-node-sdk/lib/froalaEditor');
const fs = require('fs');
const path = require('path');
const Province = require('../models/Province');
const City = require('../models/City');
const Advertise = require('../models/Advertise');
const Vote = require('../models/Vote');
const Organizer = require('../models/Organizer');
const User = require('../models/User');
const Competition = require('../models/Competition');
const Team = require('../models/Team');
const Feedback = require('../models/Feedback');
const Applying = require('../models/Applying');
const config = require('../config')();
const Member = require('../models/Member');
const Game = require('../models/Game');

module.exports = BaseController.extend({
    name: 'CommonController',
    upload_image: async function (req, res, next) {
        if (!req.session.login) return res.send("");
        let user_id = req.session.user.id;
        let public_path = path.resolve('public');
        let userFolderPath = public_path + "/uploads/" + user_id;
        if (!fs.existsSync(userFolderPath)){
            fs.mkdirSync(userFolderPath);
        }
        FroalaEditor.Image.upload(req, '/public/uploads/' + user_id + "/", function (err, data) {
            if (err) return res.send(JSON.stringify(err));
            data.link = data.link.substr(7);
            data.link = config.baseAPIURL + data.link;
            return res.send(data);
        })
    },
    upload_editor_image: async function (req, res, next) {
        let public_path = path.resolve('public');
        let new_folder = "/editor_uploads/" + new Date().getFullYear().toString() + "_" + ((new Date()).getMonth()+1).toString();
        let userFolderPath = public_path + new_folder;
        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath);
        }
        let images = req.body.img_data;
        let res_urls = [];
        for (let i = 0; i < images.length; i++) {
            let imageData = images[i].replace(/^data:image\/\w+;base64,/, "");
            let file_extension = '.png';
            if (imageData.charAt(0) === '/') file_extension = '.jpg';
            else if (imageData.charAt(0) === 'R') file_extension = '.gif';
            let image_name = new Date().getTime().toString() + Math.floor((Math.random() * 1000) + 1).toString()  + i.toString() + file_extension;
            let new_full_path = userFolderPath + "/" + image_name;
            let new_path = config.baseSiteURL + new_folder + "/" + image_name;
            fs.writeFileSync(new_full_path, imageData, 'base64');
            res_urls.push(new_path);
        }
        return res.send({status: 'success', img_urls: res_urls});
    },
    get_cities_from_province: async function (req, res, next) {
        let province_id = req.body.province_id;
        let cities = await City.find({province_id: province_id}).sort({order: 1});
        if (!cities) cities = [];
        return res.send({status: 'success', cities: cities});
    },
    pagination: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '操作失败'});
        let organizer_id = req.session.user.id;
        let page_rows = 10;
        let table_name = req.body.table_name;
        let cur_page = req.body.cur_page;
        let total_length = 0;
        let total_pages = 1;
        let page_content = [];
        if (table_name === 'advertise') {
            let c_id = req.body.c_id;
            total_length = await Advertise.find({competition_id: c_id, ad_state: {$ne: 0}}).countDocuments();
            if (total_length) {
                total_pages = Math.ceil(total_length / page_rows);
                if (cur_page === "首页") cur_page = 1;
                else if(cur_page === "尾页") cur_page = total_pages;
                else cur_page = parseInt(cur_page);
            } else total_pages = 1;
            page_content = await Advertise.find({competition_id: c_id, ad_state: {$ne: 0}}).skip((cur_page - 1) * page_rows).limit(page_rows)
        } else if (table_name === 'vote') {
            let c_id = req.body.c_id;
            total_length = await Vote.find({competition_id: c_id, v_state: {$ne: 0}}).countDocuments();
            if (total_length) {
                total_pages = Math.ceil(total_length / page_rows);
                if (cur_page === "首页") cur_page = 1;
                else if(cur_page === "尾页") cur_page = total_pages;
                else cur_page = parseInt(cur_page);
            } else total_pages = 1;
            page_content = await Vote.find({competition_id: c_id, ad_state: {$ne: 0}}).skip((cur_page - 1) * page_rows).limit(page_rows)
        } else if (table_name === 'competition') {
            total_length = await Competition.find({c_organizer_id: organizer_id, c_state: {$ne: 0}}).countDocuments();
            if (total_length) {
                total_pages = Math.ceil(total_length / page_rows);
                if (cur_page === "首页") cur_page = 1;
                else if(cur_page === "尾页") cur_page = total_pages;
                else cur_page = parseInt(cur_page);
            } else total_pages = 1;
            page_content = await Competition.find({c_organizer_id: organizer_id, c_state: {$ne: 0}}).skip((cur_page - 1) * page_rows).limit(page_rows);
        } else if (table_name === 'feedback') {
            // admin page
            total_length = await Feedback.find({}).countDocuments();
            if (total_length) {
                total_pages = Math.ceil(total_length / page_rows);
                if (cur_page === "首页") cur_page = 1;
                else if(cur_page === "尾页") cur_page = total_pages;
                else cur_page = parseInt(cur_page);
            } else total_pages = 1;
            page_content = await Feedback.find({}).skip((cur_page - 1) * page_rows).limit(page_rows);
        }
        else {
            return res.send({status: 'fail', message: 'pagination is failed'});
        }
        return res.send({status: 'success', page_content: page_content, total_pages: total_pages, page_rows: page_rows});
    },
    search_and_pagination: async function (req, res, next) {
        if (!req.session.login) return res.send({status: 'fail', message: '操作失败'});
        let page_rows = 10;
        let table_name = req.body.table_name;
        let cur_page = req.body.cur_page;
        let total_length = 0;
        let total_pages = 1;
        let search_result = [];
        if (table_name === 'organizer') {
            let organizer_queries = [];
            organizer_queries.push({role: 1});
            if (req.body.filter1_text !== '') {
                 if (req.body.filter1 === 'nickname') organizer_queries.push({nickname: {$regex: req.body.filter1_text, $options: 'i'}});
                 else if (req.body.filter === 'name') organizer_queries.push({name: {$regex: req.body.filter1_text, $options: 'i'}});
                 else if (req.body.filter === 'phone') organizer_queries.push({phone: {$regex: req.body.filter1_text, $options: 'i'}});
            }
            if (req.body.filter2 == '1') organizer_queries.push({identify: 0});
            else if (req.body.filter2 == '2') organizer_queries.push({identify: 1});
            else if (req.body.filter2 == '3') organizer_queries.push({identify: 2});
            if (req.body.filter3 == '1') organizer_queries.push({disabledState: false});
            else if (req.body.filter3 == '2') organizer_queries.push({disabledState: true});
            if (req.body.from_date === '' && req.body.to_date !== '') {
                organizer_queries.push({id_time: {$lte: new Date(req.body.to_date)}});
            } else if (req.body.from_date !== '' && req.body.to_date === '') {
                organizer_queries.push({id_time: {$gte: new Date(req.body.from_date)}});
            } else if (req.body.from_date !== '' && req.body.to_date !== '') {
                organizer_queries.push({id_time: {$gte: new Date(req.body.from_date), $lte: new Date(req.body.to_date)}});
            }
            let organizer_query = {};
            if (organizer_queries.length === 1) {
                organizer_query = organizer_queries[0];
            } else if (organizer_queries.length > 1) {
                organizer_query['$and'] = organizer_queries;
            }
            total_length = await Organizer.find(organizer_query).countDocuments();
            if (total_length !== 0) total_pages = Math.ceil(total_length / page_rows);
            if (cur_page === "首页") cur_page = 1;
            else if(cur_page === "尾页") cur_page = total_pages;
            else cur_page = parseInt(cur_page);
            search_result = await Organizer.find(organizer_query).sort({identify: 1}).skip((cur_page - 1) * page_rows).limit(page_rows);

        } else if (table_name === 'team') {
            let team_queries = [];
            team_queries.push({
                $lookup: {
                    from: 'applies',
                    localField: 'id',
                    foreignField: 'team_id',
                    as: 'apply'
                },
            });
            team_queries.push({
                $lookup: {
                    from: 'competitions',
                    localField: 'apply.competition_id',
                    foreignField: 'id',
                    as: 'competition'
                },
            });
            team_queries.push({
                $lookup: {
                    from: 'members',
                    let: {pid: '$t_members'},
                    pipeline: [
                        {$match: {$expr: {$in: ['$id', '$$pid']}}}
                    ],
                    as: 'members'
                }
            });
            team_queries.push({"$unwind":"$members"});
            team_queries.push({$match: {'members.m_state': 1}});
            if (req.body.team_filter1_value !== '') {
                if (req.body.team_filter1 === '1') team_queries.push({$match: {t_full_name: {$regex: req.body.team_filter1_value, $options: 'i'}}});
                if (req.body.team_filter1 === '2') team_queries.push({$match: {'members.m_name': {$regex: req.body.team_filter1_value, $options: 'i'}}});
                if (req.body.team_filter1 === '3') team_queries.push({$match: {'members.m_phone': {$regex: req.body.team_filter1_value, $options: 'i'}}});
            }
            if (req.body.team_filter2 !== 'none') team_queries.push({$match: {t_type: req.body.team_filter2}});
            if (req.body.team_filter3 !== 'none') team_queries.push({$match: {t_city: req.body.team_filter3}});
            let total_teams = await Team.aggregate(team_queries);
            total_length = total_teams.length;
            if (total_length !== 0) total_pages = Math.ceil(total_length / page_rows);
            if (cur_page === "首页") cur_page = 1;
            else if(cur_page === "尾页") cur_page = total_pages;
            else cur_page = parseInt(cur_page);
            search_result = await Team.aggregate(team_queries).skip((cur_page - 1) * page_rows).limit(page_rows);

        } else if (table_name === 'user') {
            let user_queries = [];
            if (req.body.user_filter1_value !== '') {
                if (req.body.user_filter1 === 'nickname') user_queries.push({nickname: {$regex: req.body.user_filter1_value, $options: 'i'}});
                else if (req.body.user_filter1 === 'name') user_queries.push({name: {$regex: req.body.user_filter1_value, $options: 'i'}});
                else if (req.body.user_filter1 === 'phone') user_queries.push({phone: {$regex: req.body.user_filter1_value, $options: 'i'}});
            }
            if (req.body.user_filter2 == '1') user_queries.push({disabledState: false});
            else if (req.body.user_filter2 == '2') user_queries.push({disabledState: true});
            let user_query = {};
            if (user_queries.length === 1) user_query = user_queries[0];
            else if (user_queries.length > 1) user_query['$and'] = user_queries;
            total_length = await User.find(user_query).countDocuments();
            if (total_length !== 0) total_pages = Math.ceil(total_length / page_rows);
            if (cur_page === "首页") cur_page = 1;
            else if(cur_page === "尾页") cur_page = total_pages;
            else cur_page = parseInt(cur_page);
            search_result = await User.find(user_query).skip((cur_page - 1) * page_rows).limit(page_rows);

        } else if (table_name === 'competition') {
            let competition_queries = [];
            competition_queries.push({$match: {c_state: {$ne: 0}}});
            competition_queries.push({ $lookup:
                    {
                        from: 'organizers',
                        localField: 'c_organizer_id',
                        foreignField: 'id',
                        as: 'organizer'
                    }
            });
            if (req.body.filter_name_value !== '') {
                if (req.body.filter_name === 'organizer') {
                    competition_queries.push({$match: {'organizer.name': {$regex: req.body.filter_name_value, $options: 'i'}}});
                } else {
                    competition_queries.push({$match: {c_name: {$regex: req.body.filter_name_value, $options: 'i'}}});
                }
            }
            if (req.body.filter_active_type === '1') competition_queries.push({$match: {c_active_type: 1}});
            if (req.body.filter_province !== 'all') competition_queries.push({$match: {'c_province.province_id': req.body.filter_province}});
            if (req.body.filter_city !== 'all') competition_queries.push({$match: {'c_city.city_id': req.body.filter_city}});
            if (req.body.filter_post_status === 'yes') competition_queries.push({$match: {is_published: 2}});
            else if (req.body.filter_post_status === 'no') competition_queries.push({$match: {is_published: 1}});
            if (req.body.filter_order === 'yes') competition_queries.push({$match: {c_order: 1}});
            else if (req.body.filter_order === 'no') competition_queries.push({$match: {c_order: 2}});
            if (req.body.from_date !== '') {
                competition_queries.push({$match: {c_start_time: {$gte: req.body.from_date}}});
            } else if (req.body.to_date !== '') {
                competition_queries.push({$match: {c_end_time: {$lte: req.body.to_date}}});
            }
            let total_competitions = await Competition.aggregate(competition_queries);
            total_length = total_competitions.length;
            if (total_length !== 0) total_pages = Math.ceil(total_length / page_rows);
            if (cur_page === "首页") cur_page = 1;
            else if(cur_page === "尾页") cur_page = total_pages;
            else cur_page = parseInt(cur_page);
            search_result = await Competition.aggregate(competition_queries).sort({c_order: 1}).skip((cur_page - 1) * page_rows).limit(page_rows);

        } else {
            return res.send({status: 'fail', message: '操作失败'});
        }
        return res.send({status: 'success', search_result: search_result, page_rows: page_rows, total_pages: total_pages});
    },
    get_competition_data_from_id: async function (req, res, next) {
        let c_id = req.body.c_id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: 'Undefined Competition'});
        return res.send({status: 'success', message: '加载成功', competition: competition});
    },
    get_applied_teams_from_competition: async function (req, res, next) {
        let c_id = req.body.c_id;
        let applies = await Applying.aggregate([
            {$match: {competition_id: c_id, a_state: 2}},
            {$lookup:
                    {
                        from: 'teams',
                        localField: 'team_id',
                        foreignField: 'id',
                        as: 'team'
                    }
            }
        ]);
        return res.send({status: 'success', result: applies});
    },
    // change state of competition
    change_competition_state: async function (req, res, next) {
        let competition = await Competition.findOne({id: req.body.id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        await competition.updateOne({c_state: req.body.value});
        return res.send({status: 'success', message: '操作成功'});
    },
    get_members_for_structure: async function (req, res, next) {
        let name1 = req.body.team_name1;
        let name2 = req.body.team_name2;
        let team1 = await Team.aggregate([
            {$match: {t_full_name: name1}},
            {'$lookup': {
                    'from': 'members',
                    'let': {'pid': '$t_members'},
                    'pipeline': [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    'as': 'members'
                }
            }
        ]);
        let team2 = await Team.aggregate([
            {$match: {t_full_name: name2}},
            {'$lookup': {
                    'from': 'members',
                    'let': {'pid': '$t_members'},
                    'pipeline': [
                        {'$match': {'$expr': {'$in': ['$id', '$$pid']}}}
                    ],
                    'as': 'members'
                }
            }
        ]);
        if (team1.length === 0 || team2.length === 0) return res.send({status: 'fail', message: 'Unknown Team'});
        team1 = team1[0];
        team2 = team2[0];
        return res.send({status: 'success', result: {team1, team2}});
    },
    get_members_from_team_name: async function (req, res, next) {
        let name = req.body.team_name;
        let team = await Team.findOne({t_full_name: name});
        if (!team) return res.send({status: 'fail', message: 'Unknown Team'});
        let members = await Member.find({team_id: team.id});
        return res.send({status: 'success', result: members});
    },
    get_shooter_system_data: async function (req, res, next) {
        let m_id = req.body.member_id;
        let member = await Member.findOne({id: m_id});
        if (!member) return res.send({status: 'fail', message: '操作失败'});
        let team = await Team.findOne({id: member.team_id});
        if (!team) return res.send({status: 'fail', message: '操作失败'});
        let games = await Game.find({g_state: 3, $or: [{g_team1: team.id}, {g_team2: team.id}]});
        let total_score = 0; let sub_score = 0;
        for (let i = 0; i <  games.length; i++) {
            for (let j = 0; j < games[i].g_situation.length; j++) {
                if (games[i].g_situation[j][0] === m_id && games[i].g_situation[j][2] === '进球') {
                    total_score += 1;
                }
                else if (games[i].g_situation[j][0] === m_id && games[i].g_situation[j][2] === '点球') {
                    sub_score += 1;
                }
            }
        }
        return res.send({status: 'success', message: '操作成功', result: {total_score, sub_score}});
    },
    get_ranking_system_data: async function (req, res, next) {
        let c_id = req.body.c_id;
        let competition = await Competition.findOne({id: c_id});
        if (!competition) return res.send({status: 'fail', message: '操作失败'});
        let g_type = 1;
        if (competition.c_type === 3 || competition.c_type === 4) g_type = 2;
        else if (competition.c_type === 5) return res.send({status: 'fail', message: '操作失败'});
        let t_id = req.body.team_id;
        let games = await Game.aggregate([
            {$match: {competition_id: c_id, g_state: 3, g_type: g_type}},
            {$match: {$or: [{g_team1: t_id}, {g_team2: t_id}]}}
        ]);
        if (games.length === 0) return res.send({status: 'fail', message: '操作失败'});
        let ranking = {team_id: t_id, win_count: 0, draw_count: 0, lose_count: 0, win_score: 0, lose_score: 0};
        for (let i = 0; i < games.length; i++) {
            let team1 = games[i].g_team1;
            let team2 = games[i].g_team2;
            let team1_score = games[i].team1_total_score;
            let team2_score = games[i].team2_total_score;
            if (team1_score == null || team2_score == null) continue;
            if (team1 === t_id) {
                if (team1_score > team2_score) ranking.win_count += 1;
                else if (team1_score < team2_score) ranking.lose_count += 1;
                else if (team1_score === team2_score) ranking.draw_count += 1;
                ranking.win_score += team1_score;
                ranking.lose_score += team2_score;
            } else if (team2 === t_id) {
                if (team1_score < team2_score) ranking.win_count += 1;
                else if (team1_score > team2_score) ranking.lose_count += 1;
                else if (team1_score === team2_score) ranking.draw_count += 1;
                ranking.win_score += team2_score;
                ranking.lose_score += team1_score;
            }
        }
        return res.send({status: 'success', message: '操作成功', result: ranking});
    },

});