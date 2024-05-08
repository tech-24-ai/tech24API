'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldReportAbuseSchema extends Schema {
  up () {
    this.table('report_abuses', (table) => {
      // alter table
	  table.boolean("reply_type").defaultTo(false).comment("0 - community / question, 1 - Answer, 2 - Comments").after('reason');
    })
  }

  down () {
    this.table('report_abuses', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldReportAbuseSchema
