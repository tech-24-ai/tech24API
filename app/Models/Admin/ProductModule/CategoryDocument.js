'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CategoryDocument extends Model {
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

module.exports = CategoryDocument
