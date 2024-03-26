'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Question extends Model {
    options() {
        return this.belongsToMany('App/Models/Admin/ProductModule/Option')
            .pivotModel('App/Models/Admin/ProductModule/QuestionOption')
            .withPivot(['sort_order'])
    }

    option() {
        return this.hasMany('App/Models/Admin/ProductModule/QuestionOption')
    }

    step() {
        return this.belongsTo('App/Models/Admin/ProductModule/Step')
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

module.exports = Question
