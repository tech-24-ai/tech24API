'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PermissionRole extends Model {
    static get table() {
        return 'permission_role'
    }

    permission() {
        return this.belongsTo('App/Models/Admin/UserModule/Permission')
    }

    static get incrementing() {
        return false
    }

    static get createdAtColumn() {
        return null;
    }

    static get updatedAtColumn() {
        return null;
    }
}

module.exports = PermissionRole
