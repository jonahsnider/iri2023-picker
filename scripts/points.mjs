function calculatePointsForTeamStatus(teamStatus) {
  let score = 0;

  // Winner gets 30 points
  // Finalist gets 20 points
  // Semifinalist gets 13 points
  // Quarterfinalist gets 7 points
  switch (teamStatus.outcome) {
    case "w":
      score += 30;
      break;
    case "f":
      score += 20;
      break;
    case "sf":
      score += 13;
      break;
    case "qf":
      score += 7;
      break;
  }

  if (teamStatus.alliancePick === 0) {
    // If captain:
    // 25 points minus their rank
    score += 25 - teamStatus.ranking;
  } else if (teamStatus.alliancePick > 0) {
    const teamsPickedBefore = 8 * (teamStatus.alliancePick - 1) + teamStatus.alliance;

    // If picked:
    // 25 minus number of teams picked before them
    score += 25 - teamsPickedBefore;
  }

  return score;
}

export function scoreEvent(eventStatuses) {
  const scores = eventStatuses.map((teamStatus) => ({
    teamNumber: teamStatus.teamNumber,
    score: calculatePointsForTeamStatus(teamStatus),
  }));

  scores.sort((a, b) => b.score - a.score);

  return scores;
}

export function scoresToCsv(scores) {
  return ["teamNumber,points", ...scores.map((score) => `${score.teamNumber},${score.score}`)].join("\n");
}
