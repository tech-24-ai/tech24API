'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Document extends Model {

    document_type() {
        return this.belongsTo('App/Models/Admin/DocumentModule/DocumentType')
    }

    researchTopic() {
        return this.belongsTo('App/Models/Admin/DocumentModule/ResearchTopic')
    }

    category() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category')
    }

    category_name() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category')
    }

    documentTags() {
		return this.belongsToMany(
			"App/Models/Admin/DocumentModule/ResearchTag"
		).pivotModel("App/Models/Admin/DocumentModule/DocumentTag");
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

module.exports = Document
