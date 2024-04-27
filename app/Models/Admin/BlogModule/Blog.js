'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Blog extends Model {

    blog_topic() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category','blog_topic_id','id');
    }

    is_saved_blog() {
		return this.belongsTo('App/Models/Admin/CommunityModule/CommunityVisitorLibrary', 'id', 'blog_id')
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

module.exports = Blog
