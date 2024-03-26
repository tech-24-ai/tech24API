'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require("moment");
class Permission extends Model {
    role() {
        return this.belongsTo('App/Models/Admin/UserModule/Role')
    }
    permission_group() {
        return this.belongsTo('App/Models/Admin/UserModule/PermissionGroup')
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

module.exports = Permission
