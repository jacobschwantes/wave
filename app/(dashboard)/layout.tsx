import Header from "@/components/ui/header";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex flex-col w-full">
			<Header />
			{children}
		</div>
	);
}
