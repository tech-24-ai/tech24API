'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContactsSchema extends Schema {
  up() {
    this.create('contact_types', (table) => {
      table.increments()
      table.string('name', 100)
      table.integer('sort_order')
      table.timestamps()
    })
    this.create('contacts', (table) => {
      table.increments()
      table.integer('contact_type_id').unsigned().references('id').inTable('contact_types').onDelete('restrict').onUpdate('cascade')
      table.string('organisation_name', 100)
      table.text('requirement', 'text')
      table.text('company_address', 'text')
      table.string('website', 100)
      table.string('domain_expertise', 100)
      table.string('revenue_range', 100)
      table.string('number_employees', 100)
      table.timestamps()
    })
  }

  down() {
    this.drop('contact_types')
    this.drop('contacts')
  }
}

module.exports = ContactsSchema
