'use strict'

class StoreRss {

  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: `required|unique:mi_segments,name,id,${id}`,
        description: `required`,
      }
    } else {
      return {
        name: 'required|unique:mi_segments,name',
        description: 'required',
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

module.exports = StoreRss
