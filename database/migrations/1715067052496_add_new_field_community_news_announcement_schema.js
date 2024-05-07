'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNewFieldCommunityNewsAnnouncementSchema extends Schema {
  up () {
    this.table('community_news_announcements', (table) => {
      // alter table
	  table.text("url_slug").after('title');
    })
  }

  down () {
    this.table('community_news_announcements', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddNewFieldCommunityNewsAnnouncementSchema
