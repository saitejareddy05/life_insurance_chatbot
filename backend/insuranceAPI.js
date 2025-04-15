// backend/insuranceAPI.js
const fetch = require('node-fetch');

async function fetchInsuranceData(queryParams) {
  const url = new URL("https://api.example.com/insurance");
  Object.keys(queryParams).forEach((key) =>
    url.searchParams.append(key, queryParams[key])
  );

  try {
    const response = await fetch(url.href);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching insurance data:", error);
    return {};
  }
}

module.exports = { fetchInsuranceData };
