'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldsVisitorSchema extends Schema {
  up () {
    this.table('visitors', (table) => {
      // alter table
		table.string("alternate_email").nullable().after('email');
		table.string("country_code").nullable().after('alternate_email');
    })
  }

  down () {
    this.table('visitors', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldsVisitorSchema
