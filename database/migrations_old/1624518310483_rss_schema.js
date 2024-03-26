'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiSegmentSchema extends Schema {
  up () {
    this.create('rsses', (table) => {
      table.increments()
      table.string('name')
      table.string('description')
      table.string('url')
      table.timestamps()
    })
  }
  down () {
    this.drop('rsses')
  }
}

module.exports = MiSegmentSchema
