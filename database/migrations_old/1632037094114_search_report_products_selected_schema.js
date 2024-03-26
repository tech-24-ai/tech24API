'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SearchReportProductsSelectedSchema extends Schema {
  up () {
    this.alter('search_report_products', (table) => {
      // alter table
      table.boolean('selected').defaultTo(false)
    })
  }

  down () {
    this.alter('search_report_products', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SearchReportProductsSelectedSchema
