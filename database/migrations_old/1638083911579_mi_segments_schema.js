'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiSegmentsSchema extends Schema {
  up () {
    this.table('mi_segments', (table) => {
      // alter table
      table.boolean('is_free').defaultTo(false)
    })
  }

  down () {
    this.table('mi_segments', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MiSegmentsSchema
