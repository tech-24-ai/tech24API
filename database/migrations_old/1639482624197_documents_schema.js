'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DocumentsSchema extends Schema {
  up () {
    this.table('documents', (table) => {
      // alter table
      table.enum('subscription_category', ['Basic', 'Advance','Enterprise']).defaultTo('Basic').notNullable()
      table.decimal('enterprise_document_price').unsigned().nullable()
      table.decimal('enterprise_document_special_price').unsigned().nullable()
      table.decimal('advance_document_price').unsigned().nullable()
      table.decimal('advance_document_special_price').unsigned().nullable()
    })
  }

  down () {
    this.table('documents', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DocumentsSchema
