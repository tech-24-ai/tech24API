'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");

class Anamoly extends Model {

  

    users() {
        return this.belongsTo('App/Models/Admin/UserModule/User','resolved_id','id')
    }

    vendors() {
        return this.belongsTo('App/Models/Admin/VendorModule/Vendor','vendor_id','id')
    }

    static get dates() {
        return super.dates.concat(['detected_datetime', 'created_at', 'updated_at'])
    }    

    static castDates(field, value) {
        if (['detected_datetime', 'created_at', 'updated_at'].includes(field)) {
            return moment(value).format('DD-MM-YYYY hh:mm A')
        }
        return super.formatDates(field, value)
    }
}

module.exports = Anamoly
