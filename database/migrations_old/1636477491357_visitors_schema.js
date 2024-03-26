'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorsSchema extends Schema {
  up () {
    this.table('visitors', (table) => {
      table.boolean('is_blocked').defaultTo(false)
    })
  }

  down () {
    this.table('visitors', (table) => {
      // reverse alternations
    })
  }
}

module.exports = VisitorsSchema
