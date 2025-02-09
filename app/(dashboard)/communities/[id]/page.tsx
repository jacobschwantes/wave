export default async function CommunityPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <div>CommunityPage: {id}</div>;
}
