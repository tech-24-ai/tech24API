'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up() {
    this.create('users', (table) => {
      table.increments()
      table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('restrict').onUpdate('cascade')
      table.string('name', 100)
      table.string('email', 254).notNullable().unique()
      table.string('mobile', 10)
      table.string('password', 60)
      table.timestamps()
    })
  }

  down() {
    this.drop('users')
  }
}

module.exports = UserSchema
