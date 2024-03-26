'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuDocSubcriptionSchema extends Schema {
  up () {
    this.create('itmap_eu_doc_subcriptions', (table) => {
      table.increments()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.integer('document_id').unsigned().notNullable()
      table.integer('payment_transcation_id').unsigned().nullable()
      table.integer('user_id').unsigned().notNullable()

      table.datetime('purchase_date').notNullable()
      table.integer('created_by').unsigned().nullable()
     
    })
  }

  down () {
    this.drop('itmap_eu_doc_subcriptions')
  }
}

module.exports = ItmapEuDocSubcriptionSchema
