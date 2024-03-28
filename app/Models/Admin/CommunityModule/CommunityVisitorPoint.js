'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CommunityVisitorPoint extends Model {

    visitor() {
		return this.belongsTo(
			"App/Models/Admin/VisitorModule/Visitor"
		);
	}

	communityPostReply() {
		return this.belongsTo(
			"App/Models/Admin/CommunityModule/CommunityPostReply"
		);
	}
}

module.exports = CommunityVisitorPoint
