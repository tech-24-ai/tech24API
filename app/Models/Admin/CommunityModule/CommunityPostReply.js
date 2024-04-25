'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require("moment");

class CommunityPostReply extends Model {
	
	visitor() {
		return this.belongsTo(
			"App/Models/Admin/VisitorModule/Visitor"
		);
	}
	
	comments() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPostReply", "id", "parent_id",
		);
	}
	
	parentData() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPostReply", "parent_id", "id",
		);
	}
	
	postReplyVote() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/Vote"
		);
	}
	
	postReportAbuse() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/ReportAbuse"
		);
	}

	communityPost() {
		return this.belongsTo(
			"App/Models/Admin/CommunityModule/CommunityPost"
		);
	}
	
	communityPostVote() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/Vote", "community_post_id", "community_post_id"
		);
	}
	
	static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = CommunityPostReply
