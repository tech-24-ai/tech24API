'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CronSchema extends Schema {
  up () {
    this.table('cron_jobs', (table) => {
      table.datetime('start_date')
    })
  }

  down () {
    this.table('cron_jobs', (table) => {
      // reverse alternations
    })
  }
}

module.exports = CronSchema
