'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DocumentsSchema extends Schema {
  up() {
    this.create('document_types', (table) => {
      table.increments()
      table.string('name', 100)
      table.integer('sort_order')
      table.timestamps()
    })
    this.create('documents', (table) => {
      table.increments()
      table.integer('document_type_id').unsigned().references('id').inTable('document_types').onDelete('restrict').onUpdate('cascade')
      table.string('name', 100)
      table.string('price', 100)
      table.text('description', 'text')
      table.text('url', 'text')
      table.timestamps()
    })
    this.create('category_documents', (table) => {
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('cascade').onUpdate('cascade')
      table.integer('document_id').unsigned().references('id').inTable('documents').onDelete('cascade').onUpdate('cascade')
    })
  }

  down() {
    this.drop('document_types')
    this.drop('documents')
    this.drop('category_documents')
  }
}

module.exports = DocumentsSchema
