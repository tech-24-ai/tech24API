'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class VisitorsSchema extends Schema {
  up() {
    this.create('visitor_groups', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.timestamps()
    })

    this.create('module_visitor_group', (table) => {
      table.integer('visitor_group_id').unsigned().references('id').inTable('visitor_groups').onDelete('cascade').onUpdate('cascade')
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('cascade').onUpdate('cascade')
    })

    this.create('visitors', (table) => {
      table.increments()
      table.integer('visitor_group_id').nullable()
      table.string('name', 100)
      table.string('email', 254).notNullable().unique()
      table.string('mobile', 20)
      table.string('password', 60)
      table.string('designation', 100)
      table.string('company', 100)
      table.string('register_from', 100).nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('visitor_groups')
    this.drop('module_visitor_group')
    this.drop('visitors')
  }
}

module.exports = VisitorsSchema
