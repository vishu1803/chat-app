import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    messages: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Message'  // Assuming you have a 'Message' model
    }]
});

export const Conversation = mongoose.model('Conversation', conversationSchema);  // Use the schema object, not a string
