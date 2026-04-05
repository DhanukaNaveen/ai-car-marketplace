// This custom hook, useFetch, is designed to handle asynchronous data fetching in React components. It manages the loading state, error handling, and the fetched data itself. The hook takes a callback function (cb) as an argument, which is expected to be an asynchronous function that performs the actual data fetching. The hook returns an object containing the fetched data, loading state, error state, a function to trigger the fetch (fn), and a setter for the data (setData). It also uses the "sonner" library to display error messages as toast notifications when a fetch operation fails.

import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {  // The useFetch hook takes a callback function (cb) as an argument, which is expected to be an asynchronous function that performs the data fetching.callback function (cb) is the function that will be called to perform the actual data fetching. This allows the hook to be reusable for different types of data fetching operations, as you can pass in any asynchronous function that returns a promise.
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
