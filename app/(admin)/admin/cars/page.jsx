import { CarsList } from "./_components/car-list";

export const metadata = {
  title: "Cars | Vehiql Admin",
  description: "Manage cars in your marketplace",
};  //metadata object that defines the title and description for the Cars management page in the Vehiql Admin portal. This metadata can be used for SEO purposes and to provide context about the page when it is shared on social media or displayed in search engine results.

export default function CarsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cars Management</h1>
      <CarsList />
    </div>
  );
}
