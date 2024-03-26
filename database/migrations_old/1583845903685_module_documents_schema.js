'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ModuleDocumentsSchema extends Schema {
  up () {
    this.create('module_documents', (table) => {      
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
      table.integer('document_id').unsigned().references('id').inTable('documents').onDelete('cascade').onUpdate('cascade')      
    })
  }

  down () {
    this.drop('module_documents')
  }
}

module.exports = ModuleDocumentsSchema
