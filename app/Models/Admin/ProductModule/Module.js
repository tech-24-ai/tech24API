'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Module extends Model {
    static get computed() {
        return ['status_text']
    }

    documents() {
        return this.belongsToMany('App/Models/Admin/DocumentModule/Document')
            .pivotModel('App/Models/Admin/DocumentModule/ModuleDocument')
    }

    category() {
        return this.belongsTo('App/Models/Admin/ProductModule/Category')
    }

    parent() {
        return this.belongsTo('App/Models/Admin/ProductModule/Module', 'parent_id', 'id')
    }

    children() {
        return this.hasMany('App/Models/Admin/ProductModule/Module', 'id', 'parent_id').where('status', true)
    }

    role() {
        return this.belongsTo('App/Models/Admin/UserModule/Role')
    }

    getStatusText() {
        return this.status ? "Active" : 'In Active'
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

module.exports = Module
