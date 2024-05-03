'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserCommunity extends Model {
	
	users() {
		return this.belongsTo(
			"App/Models/User"
		);
	}
}

module.exports = UserCommunity
