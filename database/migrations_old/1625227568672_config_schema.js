'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConfigSchema extends Schema {
  up () {
    this.create('configs', (table) => {
      table.string("key")
      table.string("value")
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('configs')
  }
}

module.exports = ConfigSchema
