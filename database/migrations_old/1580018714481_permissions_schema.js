'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PermissionsSchema extends Schema {
  up() {
    this.create('permission_groups', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.timestamps()
    })
    this.create('permissions', (table) => {
      table.increments()
      table.integer('permission_group_id').unsigned().references('id').inTable('permission_groups').onDelete('cascade').onUpdate('cascade')
      table.string('code', 100).notNullable()
      table.text('description').notNullable()
      table.timestamps()
    })
    this.create('permission_role', (table) => {      
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('cascade').onUpdate('cascade')
      table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('cascade').onUpdate('cascade')
    })
  }

  down() {
    this.drop('permission_groups')
    this.drop('permissions')
    this.drop('permission_role')
  }
}

module.exports = PermissionsSchema
