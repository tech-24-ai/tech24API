'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

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
	
}

module.exports = CommunityPostReply
