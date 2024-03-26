'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TranscationHistorySchema extends Schema {
  up () {
    this.create('transcation_histories', (table) => {

      table.string('payment_transcation_id').notNullable()
      table.string('transcation_status').notNullable()
      table.decimal('transcation_amount', 10, 2).unsigned();

      table.string('transcation_details').notNullable()
      table.datetime('transcation_date').notNullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('transcation_histories')
  }
}

module.exports = TranscationHistorySchema
