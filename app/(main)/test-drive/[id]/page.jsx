import { getCarById } from "@/actions/car-listing";
import { notFound } from "next/navigation";
import { TestDriveForm } from "./_components/test-drive-form";

export async function generateMetadata() {
  return {
    title: `Book Test Drive | Vehiql`,
    description: `Schedule a test drive in few seconds`,
  };
}

export default async function TestDrivePage({ params }) {
  // Validate route params and fetch car details
  const resolvedParams = await params;
  const id = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const result = await getCarById(id);

  // If car not found, show 404
  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-6 gradient-title">Book a Test Drive</h1>
      <TestDriveForm
        car={result.data}
        testDriveInfo={result.data.testDriveInfo}
      />
    </div>
  );
}
