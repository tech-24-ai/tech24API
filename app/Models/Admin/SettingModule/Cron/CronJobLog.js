'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class CronJobLog extends Model {

    static get dates() {
        return super.dates.concat(['execution_date', 'created_at', 'updated_at'])
    }    

    static castDates(field, value) {
        if (['execution_date', 'created_at', 'updated_at'].includes(field)) {
            return moment(value).format('DD-MM-YYYY hh:mm A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = CronJobLog
