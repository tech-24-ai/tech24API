'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Category extends Model {
    documents() {
        return this.belongsToMany('App/Models/Admin/DocumentModule/Document')
            .pivotModel('App/Models/Admin/ProductModule/CategoryDocument')
    }
    children() {
        return this.hasMany('App/Models/Admin/ProductModule/Module').where('parent_id', null)
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

module.exports = Category
