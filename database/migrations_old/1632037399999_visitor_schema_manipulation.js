'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorSchema extends Schema {
  up () {
    this.alter('visitors', table => {
      table.string('occupation');
      table.string('headline');
      table.string('profile_pic_url');
      table.integer('country_id').unsigned().nullable()
      table.string('country_full_name');
      table.string('city');
      table.string('state');
      table.string('connections');
      table.string('summary');
    })

    this.alter('visitors', table => {
      table.foreign('country_id')
       .references('countries.id')
       .onDelete('CASCADE')
   })

  }

  down () {
  }
}

module.exports = VisitorSchema
