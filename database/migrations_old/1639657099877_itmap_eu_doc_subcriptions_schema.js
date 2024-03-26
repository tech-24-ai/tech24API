'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuDocSubcriptionsSchema extends Schema {
  up () {
    this.table('itmap_eu_doc_subcriptions', (table) => {
      // alter table
      table.renameColumn('payment_transcation_id', 'payment_transaction_id')
    })
  }

  down () {
    this.table('itmap_eu_doc_subcriptions', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ItmapEuDocSubcriptionsSchema
