'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PartnerTypeListSchema extends Schema {
  up () {
    this.create('partner_types', (table) => {
      table.string('name')
      table.string('description')
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('partner_types')
  }
}

module.exports = PartnerTypeListSchema
