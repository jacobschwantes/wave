import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
	const now = new Date();
	const diff = now.getTime() - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) {
		return `${minutes} min ago`;
	}
	if (minutes < 1440) {
		return `${Math.floor(minutes / 60)} hours ago`;
	}
	return `${Math.floor(minutes / 1440)} days ago`;
}
