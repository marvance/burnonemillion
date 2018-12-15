var mongoose = require('mongoose')

var UltimateSchema = new mongoose.Schema({
	username: String,
	password: String,
	created: {
		type: Date,
		default: function(){return new Date() }
	},
	name: String,
	genre: String,
	bio: String,
	favorites: String,
	photo: String,
	counts: [{
		date: Date,
		words: Number
	}],
	goal: {
		date: Date,
		words: Number
	},
	friends: Array,
	badges: Array,
	badgeAnnouncements: Array,
	famous: Boolean,
	total: Number
})

var UltimateModel = mongoose.model('Ultimate', UltimateSchema)


module.exports = UltimateModel
