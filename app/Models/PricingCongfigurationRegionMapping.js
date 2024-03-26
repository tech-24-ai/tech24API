'use strict'
const moment = require("moment");

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PricingCongfigurationRegionMapping extends Model {

    countryGroups() {
        return this.belongsTo('App/Models/Admin/LocationModule/CountryGroup','country_groups_id','id')
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

module.exports = PricingCongfigurationRegionMapping
