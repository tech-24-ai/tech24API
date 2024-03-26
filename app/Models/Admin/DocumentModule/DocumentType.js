'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class DocumentType extends Model {

    documents() {
        return this.hasMany('App/Models/Admin/DocumentModule/Document')
    }

    children() {
        return this.hasMany('App/Models/Admin/DocumentModule/Document')
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

module.exports = DocumentType
