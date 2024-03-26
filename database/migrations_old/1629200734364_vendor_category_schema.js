'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VendorCategorySchema extends Schema {
  up () {
    this.createIfNotExists('vendor_categories', (table) => {
      table.increments()
      table.timestamps()
      table.string('name', 100).notNullable()
    })

    this.alter('vendors', table => {
      table.integer('vendor_category_id').unsigned().nullable()
   })

    this.alter('vendors', table => {
      table.foreign('vendor_category_id')
       .references('vendor_categories.id')
       .onDelete('CASCADE')
   })

  }

  down () {
    this.drop('vendor_categories')
  }
}

module.exports = VendorCategorySchema
