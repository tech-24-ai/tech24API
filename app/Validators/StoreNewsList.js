'use strict'

class StoreNewsList {
  get rules() {
    return {
      vendor_id: 'required',
      news_title: 'required',
      news_link: 'required',
      news_thumbnail: 'required',
      is_news_active: 'required',
      news_date: 'required',
      news_source: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreNewsList
