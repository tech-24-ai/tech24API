'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class ItmapEuTransactionHistory extends Model {

    users() {
        return this.belongsTo('App/Models/Admin/VisitorModule/Visitor','user_id','id')
    }


    static get dates() {
        return super.dates.concat(['created_at', 'updated_at'])
    }

    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('DD-MM-YYYY hh:mm A')
        }

      
        return super.formatDates(field, value)
    }
}

module.exports = ItmapEuTransactionHistory
