import { signIn } from "@/auth";

export function SignIn() {
	return (
		<form
			action={async () => {
				"use server";
				await signIn("spotify");
			}}
		>
			<button type="submit">Sign in with Spotify</button>
		</form>
	);
}
