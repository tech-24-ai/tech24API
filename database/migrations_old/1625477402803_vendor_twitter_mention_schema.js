'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VendorTwitterMentionSchema extends Schema {
  up () {
    this.create('vendor_twitter_mentions', (table) => {
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('cascade').onUpdate('cascade')
      table.integer('mention_count')
      table.string('month')
      table.string('year')
      table.boolean('is_api_extracted').defaultTo(false)
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('vendor_twitter_mentions')
  }
}

module.exports = VendorTwitterMentionSchema
