'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndustriesSchema extends Schema {
  up() {
    this.create('industries', (table) => {
      table.increments()
      table.string('name', 100)
      table.integer('parent_id')
      table.timestamps()
    })
  }

  down() {
    this.drop('industries')
  }
}

module.exports = IndustriesSchema
