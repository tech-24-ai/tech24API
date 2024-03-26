'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ModuleRole extends Model {
    static get table() {
        return 'module_role'
    }

    modules() {
        return this.belongsTo('App/Models/Admin/ProductModule/Module')
    }

    
    roles() {
        return this.belongsTo('App/Models/Admin/UserModule/Role')
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

module.exports = ModuleRole
