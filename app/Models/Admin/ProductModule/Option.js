'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Option extends Model {
    sub_options() {
        return this.belongsToMany('App/Models/Admin/ProductModule/SubOption')
            .pivotModel('App/Models/Admin/ProductModule/OptionSubOption')
            .withPivot(['sort_order'])
    }

    subOption() {
        return this.hasMany('App/Models/Admin/ProductModule/OptionSubOption')
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

module.exports = Option
