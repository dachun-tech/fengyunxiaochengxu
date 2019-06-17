let express = require('express');
let router = express.Router();

let config = require('../config')();
let Tenpay = require('tenpay');
let ApiController = require('../controllers/ApiController');
/***
 * *******    account
 * ***/
router.post('/getOpenId', function (req, res, next) {
    ApiController.getOpenId(req, res, next);
});
router.post('/addUser', function (req, res, next) {
    ApiController.addUser(req, res, next);
});
router.post('/addOrganizer', function (req, res, next) {
    ApiController.addOrganizer(req, res, next);
});
/***
 * *******    common
 * ***/
router.post('/image-upload', function (req, res, next) {
    ApiController.image_upload(req, res, next);
});
router.post('/favorites', function (req, res, next) {
    ApiController.favorites(req, res, next);
});
router.post('/favorite/get-all', function (req, res, next) {
    ApiController.get_favorite_com_team(req, res, next);
});
router.post('/get-notifications', function (req, res, next) {
    ApiController.get_notifications(req, res, next);
});
router.post('/get-transactions', function (req, res, next) {
    ApiController.get_transactions(req, res, next);
});
router.post('/get-withdraws', function (req, res, next) {
    ApiController.get_withdraws(req, res, next);
});

/***
 * *******    team and member
 * ***/
router.post('/add-edit-team', function (req, res, next) {
    ApiController.add_edit_team(req, res, next);
});
router.post('/add-edit-member', function (req, res, next) {
    ApiController.add_edit_member(req, res, next);
});
router.post('/member/allow-member', function (req, res, next) {
    ApiController.allow_member(req, res, next);
});
router.post('/get-team-detail', function (req, res, next) {
    ApiController.get_team_detail(req, res, next);
});
router.post('/get-member-detail', function (req, res, next) {
    ApiController.get_member_detail(req, res, next);
});
router.post('/get-all-teams', function (req, res, next) {
    ApiController.get_all_teams(req, res, next);
});
router.post('/get-teams-by-user-id', function (req, res, next) {
    ApiController.get_teams_by_user_id(req, res, next);  // get non-used teams
});
router.post('/team/get-teams-by-user', function (req, res, next) {
    ApiController.get_teams_by_user(req, res, next);  // get all teams which is created by user and applied as member too.
});

/***
 * *******    competition
 * ***/
router.post('/competition/getAll', function (req, res, next) {
    ApiController.get_all_competitions(req, res, next);
});
router.post('/competition/getById', function (req, res, next) {
    ApiController.get_competition_by_id(req, res, next);
});
router.post('/competition/get-shooter', function (req, res, next) {
    ApiController.get_shooter_from_competition(req, res, next);  // get shooter data of competition
});
router.post('/competition/get-by-user', function (req, res, next) {
    ApiController.get_competitions_by_user(req, res, next);
});
router.post('/competition/get-ranking', function (req, res, next) {
    ApiController.get_rankings(req, res,next);
});

/***
 * *******    games
 * ***/
router.post('/game/get-from-competition', function (req, res, next) {
    ApiController.get_games_from_competition(req, res, next);  // get all games of competition
});
router.post('/game/get-detail', function (req, res, next) {
    ApiController.get_game_detail(req, res, next);  // get game details with analyse info
});
router.post('/game/get-games-from-team', function (req, res, next) {
    ApiController.get_games_from_team(req, res, next);
});

/***
 * *******    applying
 * ***/
router.post('/add-applying', function (req, res,next) {
    ApiController.add_applying(req, res, next);
});

/***
 * *******    advertises and votes
 * ***/

router.post('/get-ads-votes', function (req, res, next) {
    ApiController.get_ads_votes(req, res, next);
});
router.post('/get-ad-detail', function (req, res, next) {
    ApiController.get_advertise_detail(req, res, next);
});
router.post('/get-vote-detail', function (req, res, next) {
    ApiController.get_vote_details(req, res, next);
});
router.post('/add-voting', function (req, res, next) {
    ApiController.add_voting(req, res, next);
});

/***
 * weixin payment apis
 * **/
router.post('/weixin-withdraw', function (req, res, next) {
    ApiController.api_withdraw_order(req, res, next);
});

router.post('/weixin-pay-order', function (req, res, next) {
    ApiController.api_weixin_order(req, res, next);
});

router.post('/weixin-notify',  (new Tenpay(config.payment_config)).middlewareForExpress('pay'), (req, res, next) => {
    ApiController.notify_url_func(req, res, next);
});



module.exports = router;