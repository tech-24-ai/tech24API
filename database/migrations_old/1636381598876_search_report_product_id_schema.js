'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SearchReportProductIdSchema extends Schema {
  up () {
    this.table('search_report_products', (table) => {
      table.increments()
    })
  }

  down () {
    this.table('search_report_products', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SearchReportProductIdSchema
