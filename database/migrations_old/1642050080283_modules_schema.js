'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ModulesSchema extends Schema {
  up () {
    this.table('modules', (table) => {
      table.text('notes', 'text').nullable()
    })
  }

  down () {
    this.table('modules', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ModulesSchema
