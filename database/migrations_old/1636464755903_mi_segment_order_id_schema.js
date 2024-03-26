'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiSegmentOrderIdSchema extends Schema {
  up () {
    this.table('mi_segments', (table) => {
      table.integer('order_no')
      // alter table
    })
  }

  down () {
    this.table('mi_segments', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MiSegmentOrderIdSchema
