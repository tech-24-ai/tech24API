'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldDocumentSchema extends Schema {
  up () {
    this.table('documents', (table) => {
      // alter table
	  
	  table.text("image").nullable().after('seo_url_slug');
    })
  }

  down () {
    this.table('documents', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldDocumentSchema
