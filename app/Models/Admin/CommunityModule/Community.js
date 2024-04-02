'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require("moment");

class Community extends Model {
	
	static boot () {
		super.boot()
	
		this.addTrait('@provider:Lucid/Slugify', {
			fields: {
				url_slug: 'name'
			},
			strategy: 'dbIncrement'
		})
	}
	
	communityPost() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPost"
		);
	}

	getCommunityPostReply () {
		return this.manyThrough('App/Models/Admin/CommunityModule/CommunityPost', 'communityPostReply')
	}

	userCommunities() {
		return this.hasMany("App/Models/Admin/CommunityModule/UserCommunity");
	}

	static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = Community
