import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Send } from "lucide-react";

interface Message {
	id: string;
	content: string;
	sender: string;
	timestamp: Date;
}

export default function Chat() {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			content: "Welcome to the chat! 👋",
			sender: "System",
			timestamp: new Date(),
		},
	]);
	const [newMessage, setNewMessage] = useState("");

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim()) return;

		const message: Message = {
			id: Date.now().toString(),
			content: newMessage,
			sender: "You",
			timestamp: new Date(),
		};

		setMessages([...messages, message]);
		setNewMessage("");
	};

	return (
		<div className="flex flex-col h-full max-w-2xl mx-auto p-4">
			{/* Messages container */}
			<div className="flex-1 overflow-y-auto mb-4 space-y-4">
				{messages.map((message) => (
					<Card
						key={message.id}
						className={`p-3 ${
							message.sender === "You"
								? "ml-auto bg-blue-500 text-white"
								: "mr-auto"
						} max-w-[80%]`}
					>
						<div className="flex flex-col">
							<div className="flex items-center justify-between mb-1">
								<span className="font-medium text-sm">{message.sender}</span>
								<span className="text-xs opacity-75">
									{message.timestamp.toLocaleTimeString()}
								</span>
							</div>
							<p className="text-sm">{message.content}</p>
						</div>
					</Card>
				))}
			</div>

			{/* Message input */}
			<form onSubmit={handleSendMessage} className="flex gap-2">
				<Input
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					placeholder="Type a message..."
					className="flex-1"
				/>
				<Button type="submit" size="icon">
					<Send className="h-4 w-4" />
				</Button>
			</form>
		</div>
	);
}
