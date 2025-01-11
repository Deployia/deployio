import { useState } from "react";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchMessage = async () => {
    setLoading(true);
    try {
      /* proxying to backend is done, just append the route you want to, with /api/v1/login or /api/v1/user or whatever. */
      const response = await axios.get("/api/hello"); // Make the API request to the /hello endpoint
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-gray-600 flex-col">
      <img
        src="https://github.com/fauxigent.png"
        alt="logo"
        className="w-32 h-32 rounded-full mb-6"
      />
      <h1 className="text-8xl text-white z-10 mb-4">Fauxigent MERN Template</h1>

      {/* Message paragraph */}
      <p className="text-xl text-white mb-4">{message}</p>

      {/* Spinner and button */}
      <div className="flex flex-col items-center">
        {loading ? (
          <div className="loader"></div> // You can replace this with a spinner component
        ) : (
          <button
            onClick={fetchMessage}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            Fetch Message
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
