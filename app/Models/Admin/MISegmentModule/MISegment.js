'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class MiSegment extends Model {
    static castDates(field, value) {
        if (['created_at', 'updated_at'].includes(field)) {
            return moment(value).format('MM-DD-YYYY hh:m A')
        }
        return super.formatDates(field, value)
    }
    children() {
        return this.hasMany('App/Models/Admin/MISegmentModule/MISegment', 'id', 'parent_id')
    }
}

module.exports = MiSegment
