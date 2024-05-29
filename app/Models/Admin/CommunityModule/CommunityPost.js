'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require("moment");
const { generateUniqueSlug } = require("../../../Helper/generateUniqueSlug");
let maxLength = 25

class CommunityPost extends Model {
	
	static boot () {
		super.boot()
	
		this.addHook('beforeCreate', async (userInstance) => {
			userInstance.url_slug = await generateUniqueSlug(CommunityPost, userInstance.title, 'url_slug', maxLength);
		})
	}
	
	community() {
		return this.belongsTo(
			"App/Models/Admin/CommunityModule/Community"
		);
	}
	
	attachments() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPostAttachment"
		);
	}
	
	postTags() {
		return this.belongsToMany(
			"App/Models/Admin/CommunityModule/Tag"
		).pivotModel("App/Models/Admin/CommunityModule/CommunityPostTag");
	}
	
	visitor() {
		return this.belongsTo(
			"App/Models/Admin/VisitorModule/Visitor"
		);
	}
	
	communityPostReply() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPostReply"
		);
	}
	
	communityVote() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/Vote"
		);
	}
	
	userCommunities() {
		return this.hasMany("App/Models/Admin/CommunityModule/UserCommunity", "community_id", "community_id");
	}

	postViews() {
		return this.hasMany("App/Models/Admin/CommunityModule/CommunityVisitorViewLog", "id", "reference_id");
	}

	static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = CommunityPost
