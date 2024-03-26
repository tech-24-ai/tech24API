'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TransactionHistoriesSchema extends Schema {
  up () {
    this.rename('transcation_histories', 'transaction_histories');
    this.rename('itmap_eu_transcation_histories', 'itmap_eu_transaction_histories');
    this.rename('itmap_eu_doc_subcriptions', 'itmap_eu_doc_purchases');

    this.table('transaction_histories', (table) => {
      // alter table
      table.renameColumn('transcation_code', 'transaction_code')
      table.renameColumn('payment_transcation_id', 'payment_transaction_id')
      table.renameColumn('transcation_status', 'transaction_status')
      table.renameColumn('transcation_amount', 'transaction_amount')
      table.renameColumn('transcation_details', 'transaction_details')
      table.renameColumn('transcation_date', 'transaction_date')
     
    })

    this.table('itmap_eu_transcation_histories', (table) => {
      // alter table
      table.renameColumn('transcation_code', 'transaction_code')
      table.renameColumn('payment_transcation_id', 'payment_transaction_id')
      table.renameColumn('transcation_status', 'transaction_status')
      table.renameColumn('transcation_amount', 'transaction_amount')
      table.renameColumn('transcation_details', 'transaction_details')
      table.renameColumn('transcation_date', 'transaction_date')
     
    })
  }

  down () {
    this.table('transaction_histories', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TransactionHistoriesSchema
