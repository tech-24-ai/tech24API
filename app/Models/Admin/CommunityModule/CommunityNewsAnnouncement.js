'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class CommunityNewsAnnouncement extends Model {

    static boot () {
		super.boot()
	
		this.addTrait('@provider:Lucid/Slugify', {
			fields: {
				url_slug: 'title'
			},
			strategy: 'dbIncrement'
		})
	}

    community() {
		return this.belongsTo(
			"App/Models/Admin/CommunityModule/Community"
		);
	}
    
    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = CommunityNewsAnnouncement
