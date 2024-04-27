'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');
const moment = require("moment");

class CommunityVisitorLibrary extends Model {

    visitor() {
		return this.belongsTo(
			"App/Models/Admin/VisitorModule/Visitor"
		);
	}

    blog() {
		return this.belongsTo(
			"App/Models/Admin/BlogModule/Blog"
		);
	}

    market_research() {
		return this.belongsTo(
			"App/Models/Admin/DocumentModule/Document"
		);
	}

	static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = CommunityVisitorLibrary
