import axios from "axios";

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const NBA_SPORT_KEY = "basketball_nba";

// Esta función trae las cuotas pre-partido de NBA (moneyline, spreads, totals)
export async function fetchNbaOdds() {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    throw new Error("Falta ODDS_API_KEY en .env.local");
  }

  const url = `${ODDS_API_BASE_URL}/sports/${NBA_SPORT_KEY}/odds`;

  const params = {
    apiKey,
    regions: "us",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
  };

  const response = await axios.get(url, { params });

  return response.data;
}

