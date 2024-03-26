'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class MiContact extends Model {

    investors() {
        return this.belongsTo('App/Models/Investor','investor_id','id')
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

module.exports = MiContact
