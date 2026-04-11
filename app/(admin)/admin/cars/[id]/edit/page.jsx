import { getCarById } from "@/actions/cars";
import { notFound } from "next/navigation";
import { EditCarForm } from "./_components/edit-car-form";

export const metadata = {
  title: "Edit Car | Vehiql Admin",
  description: "Edit a car listing in the admin panel",
};

export default async function EditCarPage({ params }) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const result = await getCarById(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Car</h1>
      <EditCarForm car={result.data} />
    </div>
  );
}
