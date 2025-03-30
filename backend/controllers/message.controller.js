import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId; // Updated to req.userId
        const receiverId = req.params.id;
        const { message } = req.body;

        // Find conversation between participants
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // Create new conversation if none exists
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // Create new message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        // Add message to conversation
        if (newMessage) conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(), newMessage.save()]);

        // Implement socket.io for real-time communication if needed here

        return res.status(201).json({
            success: true,
            newMessage
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, error: 'Error sending message' });
    }
};

// Get messages from conversation
export const getMessage = async (req, res) => {
    try {
        const senderId = req.userId; // Updated to req.userId
        const receiverId = req.params.id;

        // Find the conversation between participants
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');  // Populating messages with actual data

        // If conversation doesn't exist, return an empty array
        if (!conversation) return res.status(200).json({ success: true, message: [] });

        return res.status(200).json({
            success: true,
            messages: conversation.messages
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, error: 'Error fetching messages' });
    }
};

export default { sendMessage, getMessage };
