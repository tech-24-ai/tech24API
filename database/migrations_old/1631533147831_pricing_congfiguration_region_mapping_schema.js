'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingCongfigurationRegionMappingSchema extends Schema {
  up () {
    this.createIfNotExists('pricing_congfiguration_region_mappings', (table) => {
      table.increments()
      table.timestamps()
      table.integer('pricing_config_id').unsigned().nullable()
      table.string('year')
      table.integer('country_groups_id').unsigned().nullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })

    this.alter('pricing_congfiguration_region_mappings', table => {
      table.foreign('pricing_config_id')
       .references('pricing_configurations.id')
       .onDelete('CASCADE')

      table.foreign('country_groups_id')
      .references('country_groups.id')
      .onDelete('CASCADE')

      table.foreign('created_by')
      .references('users.id')
      .onDelete('CASCADE')

      table.foreign('updated_by')
      .references('users.id')
      .onDelete('CASCADE')
   })

  }

  down () {
    this.drop('pricing_congfiguration_region_mappings')
  }
  
}

module.exports = PricingCongfigurationRegionMappingSchema
