'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class SearchReport extends Model {

    questions() {
        return this.hasMany('App/Models/Report/SearchReportQuestion')
    }
    
    products() {
        return this.hasMany('App/Models/Report/SearchReportProduct')
    }

    modules() {
        return this.belongsTo('App/Models/Admin/ProductModule/Module')
    }

    categories() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category')
    }

    static get dates() {
        return super.dates.concat(['created_at', 'updated_at'])
    }    

    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY')
        }
        return super.formatDates(field, value)
    }
}

module.exports = SearchReport
