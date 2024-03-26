'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PagesSchema extends Schema {
  up() {
    this.create('pages', (table) => {
      table.increments()
      table.string('name', 100)
      table.string('slug', 150)
      table.text('details')
      table.text('html')
      table.string('type')
      table.timestamps()
    })
  }

  down() {
    this.drop('pages')
  }
}

module.exports = PagesSchema
