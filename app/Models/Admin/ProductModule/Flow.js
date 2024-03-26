'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Flow extends Model {
    questions() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Question')
            .pivotModel('App/Models/Admin/ProductModule/FlowQuestion')
            .withPivot(['sort_order'])
    }

    question() {
        return this.hasMany('App/Models/Admin/ProductModule/FlowQuestion')
    }
    
    module() {
        return this.belongsTo('App/Models/Admin/ProductModule/Module')
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

module.exports = Flow
