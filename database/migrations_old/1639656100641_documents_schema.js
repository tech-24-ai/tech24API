'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DocumentsSchema extends Schema {
  up () {
    this.table('documents', (table) => {
      // alter table
      table.dropColumn('price')
      table.dropColumn('subscription_category')
      table.renameColumn('enterprise_document_price', 'basic_document_price')
      table.renameColumn('enterprise_document_special_price', 'basic_document_special_price')
      table.integer('subscription_category').unsigned().nullable()
      table.integer('document_category').unsigned().nullable()
    })
  }

  down () {
    this.table('documents', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DocumentsSchema
