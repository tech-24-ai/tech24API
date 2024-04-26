'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DocumentLogSchema extends Schema {
  up () {
    this.create('document_logs', (table) => {
      table.increments()
	  table.integer("user_id").unsigned().references("id").inTable("users").onDelete("restrict").onUpdate("cascade");
	  table.text("description").nullable();
      table.timestamps()
    })
	
    this.table('documents', (table) => {
      table.boolean("document_content_type").comment('1 -Upload Doc/Docx format, 2 - Via Google Docs, 3 - Upload PDF/PPTX/Excel, 4 - Add Manual Content').after('subscription_category');
      table.text("drive_document_id").after('document_content_type');
    })
  }

  down () {
    this.drop('document_logs')
  }
}

module.exports = DocumentLogSchema
