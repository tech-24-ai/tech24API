'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StepsSchema extends Schema {
  up () {
    this.create('steps', (table) => {
      table.increments()
      table.string('name', 100)
      table.integer('sort_order')
      table.timestamps()
    })
  }

  down () {
    this.drop('steps')
  }
}

module.exports = StepsSchema
