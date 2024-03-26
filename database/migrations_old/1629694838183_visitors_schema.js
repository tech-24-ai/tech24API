'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorsSchema extends Schema {
  up () {
    this.alter('visitors', (table) => {
      table.text('image', 'text').nullable()
      table.text('linkedin_link', 'text').nullable()
      table.text('company_logo', 'text').nullable()
      table.string('evaluation_stage')
    })
  }

  down () {
    this.alter('visitors', (table) => {
      // reverse alternations
    })
  }
}

module.exports = VisitorsSchema
