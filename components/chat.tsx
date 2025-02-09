"use client"
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Send } from "lucide-react";
import NeonClient, { Comment } from "@/lib/database/NeonClient";

interface Message {
	id: string;
	content: string;
	sender: string;
	timestamp: Date;
}

export default function Chat({
	chats,
	rippleId,
}: {
	chats: Comment[];
	rippleId: number;
}) {
	const [messages, setMessages] = useState<Comment[]>([
		{
			id: 0,
			text: "Welcome to the chat! 👋",
			user: {
				id: 0,
				name: "System",
				email: "",
				image: "",
			},
			created_at: new Date().toLocaleTimeString(),
			updated_at: new Date().toLocaleTimeString(),
		},
		...chats,
	]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();

		// postChat(newMessage, rippleId);

		// setMessages([...messages, ]);
	};

	return (
		<div className="flex flex-col h-full max-w-2xl mx-auto p-4">
			{/* Messages container */}
			<div className="flex-1 overflow-y-auto mb-4 space-y-4">
				{messages.map((message) => (
					<Card
						key={message.id}
						className={`p-3 ${
							message.user.image.length !== 0
								? "ml-auto bg-blue-500 text-white"
								: "mr-auto"
						} max-w-[80%]`}
					>
						<div className="flex flex-col">
							<div className="flex items-center justify-between mb-1">
								<span className="font-medium text-sm">{message.user.name}</span>
								<span className="text-xs opacity-75">
									{new Date(message.created_at).toLocaleTimeString()}
								</span>
							</div>
							<p className="text-sm">{message.text}</p>
						</div>
					</Card>
				))}
			</div>

			{/* Message input */}
			<form
				action={async (a: any) => {
					console.log(a)
					const response = await fetch("/api/neon", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({text: a.get('chatinput'), id: rippleId}),
					});
		
					const result = await response.json();
					if (result.success) {
						setMessages((messages) => [...messages, result.data])
					}
				}}
				className="flex gap-2"
			>
				<Input
					name="chatinput"
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
