import React, { useState, useEffect } from "react";
import { useNavigate , useLocation } from "react-router-dom";
import axios from "axios";

const DisplayData = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Fitbit Data States
  const [heartRateData, setHeartRateData] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const [stepsData, setStepsData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ingredients, setIngredients] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const [medicalConditions,setMedicalCondition] = useState('');
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const {  condition } = location.state || {};
  const medicalConditionsList = [
    "Diabetes",
    "High BP",
    "Cholesterol",
    "Obesity",
    "Heart Disease",
    "Arthritis",
    "Asthma",
    "Energy Boost",
    "Weight Loss",
    "Low cholesterol",
    "low sugar",
    "high sugar",
    "low bp"


    // Add more conditions as needed
  ];

  // Manual Data State
  const [manualData, setManualData] = useState(() => {
    const storedData = localStorage.getItem("manual_data");
    return storedData ? JSON.parse(storedData) : {}; // Fallback to an empty object
  });

  // Function to fetch Fitbit data
  const fetchFitbitData = async () => {
    const accessToken = localStorage.getItem("fitbit_access_token");
  
    if (!accessToken) {
      setError("No Fitbit access token found. Please connect your wearables.");
      return;
    }
  
    setLoading(true);
    setError(""); // Reset error before starting the request
  
    const specificDate = "2022-11-25"; // Define the specific date you want to fetch data for
    const timestamp = new Date(specificDate).getTime();
    try {
      // Fetch Heart Rate Data (for the specific date)
      const heartRateResponse = await axios.get(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${specificDate}.json?timestamp=${timestamp}`, 
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setHeartRateData(heartRateResponse.data);
  
      // Fetch Sleep Goal Data
      const sleepResponse = await axios.get(
        `https://api.fitbit.com/1.2/user/-/sleep/goal.json?timestamp=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSleepData(sleepResponse.data);
  
      // Fetch Steps Data
      const stepsResponse = await axios.get(
        `https://api.fitbit.com/1/user/-/activities/steps/date/${specificDate}/1d.json?timestamp=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setStepsData(stepsResponse.data);
  
      // Fetch Water Data
      const waterResponse = await axios.get(
        `https://api.fitbit.com/1/user/-/foods/log/water/date/${specificDate}.json?timestamp=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setWaterData(waterResponse.data);
  
    } catch (err) {
      console.error("Error fetching Fitbit data:", err.response || err);
      setError("Failed to fetch Fitbit data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
// Check if the user is connected and fetch Fitbit data if necessary
useEffect(() => {
  const wearablesStatus = localStorage.getItem("wearables_status");

  if (wearablesStatus === "success") {
    alert("Successfully connected to wearables!");
    fetchFitbitData(); // Fetch Fitbit data if the connection is successful
  } else if (wearablesStatus === "failed") {
    alert("Failed to connect to wearables. Please try again.");
  }

  localStorage.removeItem("wearables_status"); // Clear the status
}, []);

// Polling for updates every minute
useEffect(() => {
  const interval = setInterval(() => {
    console.log("Polling Fitbit data..."); // Log when polling happens
    fetchFitbitData(); // Fetch the latest Fitbit data periodically
  }, 60000); // Every minute (60000ms)

  return () => clearInterval(interval); // Clear the interval when component is unmounted
}, []);

// Function to handle connection to wearables (Fitbit OAuth process)
const handleConnectToWearables = () => {
  window.location.href = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=23PWFN&redirect_uri=http://localhost:3000/callback&scope=activity%20nutrition%20heartrate%20sleep%20profile`;
};

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    setLoading(true);
    setError('');
  
    const ingredientsArray = ingredients ? ingredients.split(',').map(item => item.trim().toLowerCase()) : [];
    const medicalConditionsArray = medicalConditions ? medicalConditions.split(',').map(item => item.trim().toLowerCase()) : [];
  
    try {
      const response = await axios.post('http://localhost:8080/suggest-food', {
        maxCalories: maxCalories || undefined,
        ingredients: ingredientsArray.join(','),  // Send as a comma-separated string
        medicalConditions: medicalConditionsArray.join(',')  // Same for medicalConditions
      });
      
  
      if (response.data.length === 0) {
        setError('No food suggestions found.');
      } else {
        setFoodSuggestions(response.data);
        navigate("/suggest-food", { state: { suggestions: response.data } });
      }
    } catch (err) {
      setError('Failed to fetch food suggestions.');
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div className="display-data-page">
      <h1>Fitbit and Manual Data Dashboard</h1>
      <h2 style={{ textAlign: "center", color: "red", margin: "20px 0",fontSize : "1.3rem" }}>
        {condition || "No specific condition detected."}
      </h2>
      {/* Manual Data Section */}
      <div className="details-container">
        <h2>Manual Details</h2>
        <ul>
          <li>Age: {manualData.age || "N/A"}</li>
          <li>Gender: {manualData.gender || "N/A"}</li>
          <li>Height: {manualData.height || "N/A"} cm</li>
          <li>Weight: {manualData.weight || "N/A"} kg</li>
          <li>Sugar Level: {manualData.sugarLevel || "N/A"} mg/dL</li>
          <li>Blood Pressure: {manualData.bloodPressure || "N/A"} mmHg</li>
        </ul>
      </div>
      {/* Loading Spinner */}
      {loading && <p style={{textAlign: "center", color: "#21865C", margin: "20px 0"}}>Loading Fitbit data...</p>}
      <div className="details-container">
      <h2>Heart Rate Data</h2>
      {heartRateData && heartRateData["activities-heart"] ? (
        <div>
          <p><strong>Heart Rate </strong>{heartRateData["activities-heart"][0].value.restingHeartRate} bpm</p>
        </div>
      ) : (
        <p>No heart rate data available.</p>
      )}
    </div>

    <div className="details-container">
      <h2>Sleep Goal Data</h2>
      {sleepData && sleepData.goal ? (
        <div>
          <p><strong>Sleep Goal Duration: </strong>{sleepData.goal.minDuration / 60} hours</p>
          <p><strong>Last Updated: </strong>{new Date(sleepData.updatedOn).toLocaleString()}</p>
        </div>
      ) : (
        <p>No sleep goal data available.</p>
      )}
    </div>

    <div className="details-container">
      <h2>Steps Data</h2>
      {stepsData && stepsData["activities-steps"] ? (
        <div>
          <p><strong>Steps on {stepsData["activities-steps"][0].dateTime}: </strong>{stepsData["activities-steps"][0].value}</p>
        </div>
      ) : (
        <p>No steps data available.</p>
      )}
    </div>

    <div className="details-container">
      <h2>Water Intake Data</h2>
      {waterData && waterData.summary && waterData.summary.water ? (
        <div>
          <p><strong>Water intake</strong>{waterData.summary.water} mL</p>
        </div>
      ) : (
        <p>No water intake data available.</p>
      )}
    </div>
  
  
      <button
        className="wearables-btn"
        onClick={handleConnectToWearables} // This will initiate the Fitbit OAuth flow
      >
        CONNECT TO WEARABLES
      </button>
        
      <div className="details-container-food">
        <form onSubmit={handleSubmit} className="suggest-food-form">
          <h2>Food Suggestions</h2>

          {/* Ingredients Input */}
          <div>
            <label>Ingredients Restrictions</label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. paneer, chicken"
              required
            />
          </div>

          {/* Max Calories Input */}
          <div>
            <label>Max Calories</label>
            <input
              type="number"
              value={maxCalories}
              onChange={(e) => setMaxCalories(e.target.value)}
              placeholder="Enter max calories"
              required
            />
          </div>

          {/* Medical Condition Input */}
          <div className="dropdown">
            <label>Medical Condition</label>
            <select
              value={medicalConditions}
              onChange={(e) => setMedicalCondition(e.target.value)}
              required
            >
              <option value="">Select a condition</option>
              {medicalConditionsList.map((condition, index) => (
                <option key={index} value={condition.toLowerCase()}>
                  {condition}
                </option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="suggest-food-btn">SUGGEST FOOD</button>
        </form>
      </div>
    </div>
  );
};

export default DisplayData;