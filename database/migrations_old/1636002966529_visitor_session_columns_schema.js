'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorSessionColumnsSchema extends Schema {
  up () {
    this.alter("visitors", (table) => {
      table.string("visitor_ip").nullable();
      table.string("visitor_session").nullable();
      table.string("visitor_ip_country").nullable();
      table.string("visitor_ip_city").nullable();
    });
  }

  down () {
  }
}

module.exports = VisitorSessionColumnsSchema
