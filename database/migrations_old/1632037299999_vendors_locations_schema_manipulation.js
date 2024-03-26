'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VendorSchema extends Schema {
  up () {
    this.alter('vendor_locations', table => {
      table.string('is_extracted_from_api', 1).nullable()
    })
  }

  down () {
  }
}

module.exports = VendorSchema
