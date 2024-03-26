'use strict'

class StoreFlow {
  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        module_id: `required|unique:flows,module_id,id,${id}`,
        name: 'required'
      }
    } else {
      return {
        module_id: `required|unique:flows,module_id`,
        name: 'required',
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

module.exports = StoreFlow
