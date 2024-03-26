'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RegionsPartnersSchema extends Schema {
  up () {
    this.create('regions_partners', (table) => {
      table
      .integer("partner_id")
      .unsigned()
      .references("id")
      .inTable("partners")
      .onDelete("cascade")
      .onUpdate("cascade");
    table
      .integer("country_group_id")
      .unsigned()
      .references("id")
      .inTable("country_groups")
      .onDelete("cascade")
      .onUpdate("cascade");
    })
  }

  down () {
    this.drop('regions_partners')
  }
}

module.exports = RegionsPartnersSchema
