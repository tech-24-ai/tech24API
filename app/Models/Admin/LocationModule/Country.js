'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Country extends Model {

    static get computed() {
        return ['active_text']
    }

    contact_type() {
        return this.belongsTo('App/Models/Admin/ContactModule/ContactType')
    }

    country_group(){
        return this.belongsTo('App/Models/Admin/LocationModule/CountryGroup',"group_id","id")
    }

    getActiveText() {
        return this.active ? "Active" : 'In Active'
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

module.exports = Country
