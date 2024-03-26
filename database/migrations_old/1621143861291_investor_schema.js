'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvestorSchema extends Schema {
  up () {
    this.create('investors', (table) => {
      table.increments()
      table.string('name', 100)
      table.string('email', 254).notNullable().unique()
      table.string('mobile', 20)
      table.string('password', 60)
      table.string('designation', 60)
      table.string('status', 10)
      table.boolean('is_company').defaultTo(false)
      table.string('company', 60)
      table.timestamps()
    })
  }

  down () {
    this.drop('investors')
  }
}

module.exports = InvestorSchema
