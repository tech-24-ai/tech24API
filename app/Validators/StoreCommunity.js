'use strict'

class StoreCommunity {
	get rules() {
		const id = this.ctx.params.id
		if (id) {
			return {
				name: `required|unique:communities,name,id,${id}`,
				description: 'required',
				image_url: 'required',
			}
		} else {
			return {
				name: 'required|unique:communities,name',
				description: 'required',
				image_url: 'required',
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

module.exports = StoreCommunity
