'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldDocumentSchema extends Schema {
  up () {
    this.table('documents', (table) => {
      // alter table
	  
	  table.text("file_name").nullable().after('drive_document_id');
	  table.text("google_doc_url").nullable().after('file_name');
    })
  }

  down () {
    this.table('documents', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldDocumentSchema
