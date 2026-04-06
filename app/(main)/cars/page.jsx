import { CarFilters } from "./_components/car-filters";
import { getCarFilters } from "@/actions/car-listing";
import { CarListings } from "./_components/cars-listing";

export const metadata = {
  title: "Cars | Vehiql",
  description: "Browse and search for your dream car",
};

export default async function CarsPage() {
  // Fetch filters data on the server
  const filtersData = await getCarFilters();//not use useeffect because this is server component, we can fetch data directly without worrying about client-side rendering or hydration issues. The getCarFilters function is called to retrieve the necessary data for the car filters, and this data is then passed as props to the CarFilters component for rendering on the page. This approach allows us to efficiently fetch and display the filter options without needing to manage state or side effects that are typically associated with client-side components.

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-6xl mb-4 gradient-title">Browse Cars</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Section */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <CarFilters filters={filtersData.data} /> {/* The CarFilters component is rendered here, and it receives the filters data as props. This allows the component to display the available filter options (such as make, body type, fuel type, etc.) that users can use to refine their car search. By passing the filters data directly to the CarFilters component, we ensure that it has all the necessary information to render the filter controls correctly on the page. */}
        </div>

        {/* Car Listings */}
        <div className="flex-1">
          <CarListings />
        </div>
      </div>
    </div>
  );
}
