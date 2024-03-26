'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FaqsSchema extends Schema {
  up () {
    this.create('faq_categories', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.timestamps()
    })

    this.create('faqs', (table) => {
      table.increments()
      table.integer('faq_category_id').unsigned().references('id').inTable('faq_categories').onDelete('restrict').onUpdate('cascade')
      table.string('name', 100).notNullable()
      table.text('details').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('faq_categories')
    this.drop('faqs')
  }
}

module.exports = FaqsSchema
