'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MiContactsSchema extends Schema {
  up() {
    this.create('mi_contacts', (table) => {
      table.increments()
      table.integer('investor_id').unsigned().references('id').inTable('investors')
      table.string('name', 100)
      table.text('message', 'text')
      table.string('email', 100)
      table.string('mobile', 100)
      table.string('ip', 100)
      table.string('country', 100)
      table.string('city', 100)
      table.timestamps()
    })
  }

  down() {
    this.drop('contacts')
  }
}

module.exports = MiContactsSchema
