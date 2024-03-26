'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class SearchReportOption extends Model {

    static get createdAtColumn() {
        return null;
    }

    static get updatedAtColumn() {
        return null;
    }
    
    sub_options() {
        return this.hasMany('App/Models/Report/SearchReportSubOption')
    }    

    static get dates() {
        return super.dates.concat(['created_at'])
    }    

    static castDates(field, value) {
        if (['created_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY')
        }
        return super.formatDates(field, value)
    }
}

module.exports = SearchReportOption
