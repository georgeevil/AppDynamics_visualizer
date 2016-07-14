// Grab all modules + reqs + intialization
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var sanitizerPlugin = require("mongoose-sanitizer");

// Schema for graph
var graphSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
	author:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
    config: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Verify author via author ID
graphSchema.methods.verifyAuthor = function(authorID, cb) {
  isAuthor = (this.populate('created_by', ['_id']) == authorID) ? true : false;
  cb(isAuthor);
};

// Sanitize all inputs
graphSchema.plugin(sanitizerPlugin);

// Generate model
var graphs = mongoose.model('graph', graphSchema);

// Export
module.exports = graphs;
