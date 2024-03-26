'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VendorSchema extends Schema {
  up () {
    this.alter('vendors', table => {
      table.dropColumn('number_employees');
    })

    this.alter('vendors', table => {
      table.string('number_employees', 100).nullable()
      table.text('tagline', 'text').nullable()
    })
  }

  down () {
    this.drop('linkedin_url')
  }
}

module.exports = VendorSchema
