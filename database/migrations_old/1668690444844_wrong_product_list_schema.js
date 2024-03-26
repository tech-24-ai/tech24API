'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WrongProductListSchema extends Schema {
  up () {
    this.create('wrong_product_lists', (table) => {
      table.increments()
      table.text("product_id").nullable();
      table.integer("module_id").nullable();
      table.string("product_name").nullable();
      table.text("product_link").nullable();
      table.integer("vendor_id").nullable();
      table.string("vendor_name").nullable();
      table.text("vendor_website").nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('wrong_product_lists')
  }
}

module.exports = WrongProductListSchema
