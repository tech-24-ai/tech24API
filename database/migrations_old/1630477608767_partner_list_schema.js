'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PartnerListSchema extends Schema {
  up () {
    this.create('partners', (table) => {
      table.string('name')
      table.text('image', 'text').nullable()
      table.string('website')
      table.integer('country_id').nullable()
      table.string('org_size')
      table.integer('partner_type_id').nullable()
      table.integer('itmap_rating')
      table.increments()
      table.timestamps()
    })

    this.create('module_partners', (table) => {
      table.integer('partner_id').unsigned().references('id').inTable('partners').onDelete('cascade').onUpdate('cascade')
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
    })

    this.create('vendors_partners', (table) => {
      table.integer('partner_id').unsigned().references('id').inTable('partners').onDelete('cascade').onUpdate('cascade')
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('cascade').onUpdate('cascade')
    })
  }

  down () {
    this.drop('partners')
    this.drop('module_partners')
    this.drop('vendors_partners')
  }
}

module.exports = PartnerListSchema
