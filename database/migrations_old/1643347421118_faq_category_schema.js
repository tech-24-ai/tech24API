'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FaqCategorySchema extends Schema {
  up () {
    this.table('faq_categories', (table) => {
      // alter table
      table.integer('sort_order').nullable()
    })
  }

  down () {
    this.table('faq_categories', (table) => {
      // reverse alternations
    })
  }
}

module.exports = FaqCategorySchema
