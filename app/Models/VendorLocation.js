'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class VendorLocation extends Model {

    country() {
        return this.belongsTo('App/Models/Admin/LocationModule/Country')
    }
    
    vendor() {
        return this.belongsTo('App/Models/Admin/VendorModule/Vendor')
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

module.exports = VendorLocation
