import Link from "next/link";

const navItems = [
	{ label: "Home", href: "/home" },
	// { label: "Communities", href: "/communities" },
	{ label: "Profile", href: "/profile" },
];

export default function Header() {
	return (
		<header className="bg-muted w-full h-16 flex items-center justify-between px-8">
			<Link href="/">
				<h1 className="text-2xl font-bold">wave</h1>
			</Link>
			<nav className="flex items-center gap-8">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="font-medium lowercase"
					>
						{item.label}
					</Link>
				))}
			</nav>
		</header>
	);
}
