'use strict'

class StoreCompetitiveDynamic {
  get rules() {
    return {
      vendor_id: 'required',
      bubble_name: 'required',
      bubble_size: 'required',
      bubble_x: 'required',
      bubble_color: 'required',
      bubble_y: 'required',
      year: 'required',
      market: 'required',
      revenue: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreCompetitiveDynamic
