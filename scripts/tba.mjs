import { TBA_API_KEY } from "./common.mjs";

export async function getEventStatuses(eventName) {
  const response = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventName}/teams/statuses`, {
    headers: {
      "X-TBA-Auth-Key": TBA_API_KEY,
    },
  });

  const eventStatuses = await response.json();

  return Object.entries(eventStatuses).map(([teamString, status]) => {
    const teamNumber = Number(teamString.slice("frc".length));

    if (!status) {
      return {
        teamNumber,
        ranking: null,
        outcome: null,
        alliance: null,
        alliancePick: null,
      };
    }

      const ranking = status.qual.ranking.rank;
      const rawOutcome = status.playoff?.level;
      const alliance = status.alliance?.number;
      const alliancePick = status.alliance?.pick;

      const outcome = rawOutcome === "f" && status.playoff?.status === "won" ? "w" : rawOutcome;

      return {
        teamNumber,
        ranking,
        outcome: outcome,
        alliance,
        alliancePick,
      };
  });
}

export async function getRoster(eventName) {
  const response = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventName}/teams`, {
    headers: {
      "X-TBA-Auth-Key": TBA_API_KEY,
    },
  });

  const eventTeams = await response.json();

  return eventTeams.map((eventTeam) => eventTeam.team_number);
}
