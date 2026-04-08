import { getCarById } from "@/actions/car-listing";
import { CarDetails } from "./_components/car-details";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { id } = await params; // Extract the car ID from the route parameters
  const result = await getCarById(id);

  if (!result.success) {
    return {
      title: "Car Not Found | Vehiql",
      description: "The requested car could not be found",
    };
  }

  const car = result.data;

  return {
    title: `${car.year} ${car.make} ${car.model} | Vehiql`,
    description: car.description.substring(0, 160),
    openGraph: {
      images: car.images?.[0] ? [car.images[0]] : [],
    },// The openGraph property is used to specify metadata for social media sharing. Here, we set the image to the first image of the car if it exists, which will be displayed when the car details page is shared on platforms like Facebook or Twitter.
  };
}

export default async function CarDetailsPage({ params }) {
  // Fetch car details
  const { id } = await params;
  const result = await getCarById(id);

  // If car not found, show 404
  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <CarDetails car={result.data} testDriveInfo={result.data.testDriveInfo} />
    </div>
  );
}
