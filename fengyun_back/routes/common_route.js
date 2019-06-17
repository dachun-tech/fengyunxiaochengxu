let express = require('express');
let router = express.Router();
let CommonController = require('../controllers/CommonController');

router.post('/upload_image', function (req, res, next) {
    CommonController.upload_image(req, res, next);
});
router.post('/upload-editor-image', function (req, res, next) {
    CommonController.upload_editor_image(req, res, next);
});
router.post('/get_cities_from_province', function (req, res, next) {
    CommonController.get_cities_from_province(req, res, next);
});
router.post('/pagination', function (req, res, next) {
    CommonController.pagination(req, res, next);
});
router.post('/search-and-pagination', function (req, res, next) {
    CommonController.search_and_pagination(req, res, next);
});
router.post('/load-competition-data', function (req, res, next) {
    CommonController.get_competition_data_from_id(req, res, next);
});
router.post('/get-applied-teams-from-competition', function (req, res, next) {
    CommonController.get_applied_teams_from_competition(req, res, next);
});
router.post('/change-competition-state', function (req, res, next) {
    CommonController.change_competition_state(req, res, next);
});
router.post('/get-structure-members', function (req, res, next) {
    CommonController.get_members_for_structure(req, res, next);
});
router.post('/get-members-from-team-name', function (req, res, next) {
    CommonController.get_members_from_team_name(req, res, next);
});
router.post('/get-shooter-system-data', function (req, res, next) {
    CommonController.get_shooter_system_data(req, res, next);
});
router.post('/get-ranking-system-data', function (req, res, next) {
    CommonController.get_ranking_system_data(req, res, next);
});


module.exports = router;