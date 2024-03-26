'use strict'

class StoreVendor {

  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: `required|unique:partners,name,id,${id}`,
      }
    } else {
      return {
        name: 'required|unique:partners,name',
      }
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVendor
