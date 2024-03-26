'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TranscationHistoriesSchema extends Schema {
  up () {
    this.table('transcation_histories', (table) => {
      // alter table
      table.string('transcation_code').notNullable()
      table.integer('user_id').unsigned().nullable()
    })
  }

  down () {
    this.table('transcation_histories', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TranscationHistoriesSchema
