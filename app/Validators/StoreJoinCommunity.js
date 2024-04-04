'use strict'

class StoreJoinCommunity {
	get rules() {
		return {
			community_id: 'required',
		}
	}

	get validateAll() {
		return true
	}

	async fails(errorMessages) {
		return this.ctx.response.status(422).send(errorMessages)
	}
}

module.exports = StoreJoinCommunity
