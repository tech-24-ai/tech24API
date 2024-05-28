'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class User extends Model {
  static get hidden() {
    return ['password']
  }
  
  static boot() {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }

  role() {
    return this.belongsTo('App/Models/Admin/UserModule/Role')
  }

  userCommunities() {
		return this.belongsToMany(
			"App/Models/Admin/CommunityModule/Community"
		).pivotModel("App/Models/Admin/CommunityModule/UserCommunity");
	}

  communityPost() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPost", "id", "moderator_id"
		);
	}

	communityPostReplyData() {
		return this.hasMany(
			"App/Models/Admin/CommunityModule/CommunityPostReply", "id", "moderator_id"
		);
	}

  static get dates() {
    return super.dates.concat(['created_at', 'updated_at'])
}    

static castDates(field, value) {
    if (['created_at', 'updated_at'].includes(field)) {
        return moment(value).format('MM-DD-YYYY hh:m A')
    }
    return super.formatDates(field, value)
}
}

module.exports = User
