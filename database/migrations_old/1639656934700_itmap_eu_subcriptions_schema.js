'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuSubcriptionsSchema extends Schema {
  up () {
    this.table('itmap_eu_subcriptions', (table) => {
      // alter table
      
      table.renameColumn('payment_transcation_id', 'payment_transaction_id')
    })
  }

  down () {
    this.table('itmap_eu_subcriptions', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ItmapEuSubcriptionsSchema
