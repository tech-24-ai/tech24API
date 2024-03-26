'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuTranscationHistoriesSchema extends Schema {
  up () {
    this.create('itmap_eu_transcation_histories', (table) => {
      table.increments()
      table.timestamp('created_at', { useTz: true })

      table.string('payment_transcation_id').notNullable()
      table.string('transcation_status').notNullable()
      table.string('transcation_code').notNullable()
      table.decimal('transcation_amount', 10, 2).unsigned();

      table.string('transcation_details').notNullable()
      table.datetime('transcation_date').notNullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('user_id').unsigned().nullable()
      table.enum('payment_type', ['1', '2']).defaultTo('1').notNullable()//1 = Subscription ,  2 = document

    })
  }

  down () {
    this.drop('itmap_eu_transcation_histories')
  }
}

module.exports = ItmapEuTranscationHistoriesSchema
