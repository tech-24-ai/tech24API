'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SearchReportProductClickedSchema extends Schema {
  up () {
    this.table('search_report_products', (table) => {
      table.boolean('is_clicked').defaultTo(false)
    })
  }

  down () {
    this.table('search_report_products', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SearchReportProductClickedSchema
