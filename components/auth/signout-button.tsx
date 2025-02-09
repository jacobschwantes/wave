"use client"

import { signOutUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

// client component
export function SignOut() {
	return (
		<form action={signOutUser}>
			<Button type="submit">Sign Out</Button>
		</form>
	);
}
