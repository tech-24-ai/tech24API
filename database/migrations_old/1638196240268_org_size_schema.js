'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OrgSizeSchema extends Schema {
  up () {
    this.create('org_sizes', (table) => {
      table.string("name")
      table.string("value")
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('org_sizes')
  }
}

module.exports = OrgSizeSchema
