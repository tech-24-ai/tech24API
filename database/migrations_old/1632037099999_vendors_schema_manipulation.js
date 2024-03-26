'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VendorSchema extends Schema {
  up () {
    this.alter('vendors', table => {
      table.text('linkedin_url', 'text').nullable()
    })
  }

  down () {
    this.drop('linkedin_url')
  }
}

module.exports = VendorSchema
