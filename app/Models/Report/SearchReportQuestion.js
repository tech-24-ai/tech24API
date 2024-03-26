'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SearchReportQuestion extends Model {    
    static get createdAtColumn() {
        return null;
    }

    static get updatedAtColumn() {
        return null;
    }

    options() {
        return this.hasMany('App/Models/Report/SearchReportOption')
    }
}

module.exports = SearchReportQuestion
