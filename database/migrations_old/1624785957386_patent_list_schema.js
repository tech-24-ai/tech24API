'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PatentListSchema extends Schema {
  up () {
    this.create('patent_lists', (table) => {
      table.string("number")
      table.string("date")
      table.string("title")
      table.string("year")
      table.integer("vendor_id")
      table.boolean('is_api_extracted').defaultTo(false)
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('patent_lists')
  }
}

module.exports = PatentListSchema
