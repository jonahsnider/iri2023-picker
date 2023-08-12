import fs from "node:fs/promises";

const pastYears = [2017, 2018, 2019, 2022];
const years = [...pastYears, 2023];

const csv = await fs.readFile("data/combined/all.csv", "utf8");

const teamStatsRaw = csv.split("\n");

const teamStatsNullable = new Map(
  teamStatsRaw
    .filter(Boolean)
    .slice(1)
    .map((row) => {
      const [
        teamNumberString,
        points2017String,
        points2018String,
        points2019String,
        points2022String,
        epa2017String,
        epa2018String,
        epa2019String,
        epa2022String,
        epa2023String,
        opr2017String,
        opr2018String,
        opr2019String,
        opr2022String,
      ] = row.split(",");

      return [
        Number(teamNumberString),
        {
          points: {
            2017: points2017String ? Number(points2017String) : undefined,
            2018: points2018String ? Number(points2018String) : undefined,
            2019: points2019String ? Number(points2019String) : undefined,
            2022: points2022String ? Number(points2022String) : undefined,
          },
          epa: {
            2017: epa2017String ? Number(epa2017String) : undefined,
            2018: epa2018String ? Number(epa2018String) : undefined,
            2019: epa2019String ? Number(epa2019String) : undefined,
            2022: epa2022String ? Number(epa2022String) : undefined,
            2023: epa2023String ? Number(epa2023String) : undefined,
          },
          opr: {
            2017: opr2017String ? Number(opr2017String) : undefined,
            2018: opr2018String ? Number(opr2018String) : undefined,
            2019: opr2019String ? Number(opr2019String) : undefined,
            2022: opr2022String ? Number(opr2022String) : undefined,
          },
        },
      ];
    })
);

const teamStats = new Map(teamStatsNullable);

// Interpolate EPAs
for (const [team, stats] of teamStats) {
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const epa = stats.epa[year];

    if (epa) {
      continue;
    }

    let previousEPA = undefined;
    for (let j = i - 1; j >= 0; j--) {
      previousEPA = stats.epa[years[j]];
      if (previousEPA) {
        break;
      }
    }

    let nextEPA = undefined;
    for (let j = i + 1; j < years.length; j++) {
      nextEPA = stats.epa[years[j]];
      if (nextEPA) {
        break;
      }
    }

    if (previousEPA) {
      if (nextEPA) {
        stats.epa[year] = (previousEPA + nextEPA) / 2;
      } else {
        stats.epa[year] = previousEPA;
      }
    } else {
      if (nextEPA) {
        stats.epa[year] = nextEPA;
      } else {
        throw new RangeError(
          `No previous or next year for EPA for team ${team} in ${year}`
        );
      }
    }
  }
}

const teams = [...teamStats.values()];

// Fill missing OPRs by finding the closest team by EPA and using their OPR (scaled by EPA ratio)
for (const [team, stats] of teamStats) {
  for (let i = 0; i < pastYears.length; i++) {
    const year = years[i];

    if (stats.opr[year]) {
      continue;
    }

    const epa = stats.epa[year];

    let closestTeam;

    for (const otherTeam of teams) {
      if (!otherTeam.opr[year]) {
        continue;
      }

      if (closestTeam) {
        // If we already have a closest team, check if this one is closer
        const closestTeamEpa = closestTeam.epa[year];
        const otherTeamEpa = otherTeam.epa[year];

        if (
          Math.abs(epa - otherTeamEpa) < Math.abs(epa - closestTeamEpa) &&
          otherTeamEpa !== undefined
        ) {
          closestTeam = otherTeam;
        }
      } else {
        closestTeam = otherTeam;
      }
    }

    if (!closestTeam) {
      throw new RangeError(
        `No closest team for OPR for team ${team} in ${year}`
      );
    }

    stats.opr[year] = closestTeam.opr[year] * (epa / closestTeam.epa[year]);
  }
}

// Fill missing points by finding the closest team by OPR and using their points (scaled by OPR ratio)
for (const [team, stats] of teamStats) {
  for (let i = 0; i < pastYears.length; i++) {
    const year = years[i];

    if (stats.points[year]) {
      continue;
    }

    const opr = stats.opr[year];

    let closestTeam;

    for (const otherTeam of teams) {
      if (!otherTeam.points[year]) {
        continue;
      }

      if (closestTeam) {
        // If we already have a closest team, check if this one is closer
        const closestTeamOpr = closestTeam.opr[year];
        const otherTeamOpr = otherTeam.opr[year];

        if (
          Math.abs(opr - otherTeamOpr) < Math.abs(opr - closestTeamOpr) &&
          otherTeamOpr !== undefined
        ) {
          closestTeam = otherTeam;
        }
      } else {
        closestTeam = otherTeam;
      }
    }

    if (!closestTeam) {
      throw new RangeError(
        `No closest team for points for team ${team} in ${year}`
      );
    }

    stats.points[year] =
      closestTeam.points[year] * (opr / closestTeam.opr[year]);
  }
}

// Serialize
const teamStatsCsv = [
  "teamNumber,points2017,points2018,points2019,points2022,epa2017,epa2018,epa2019,epa2022,epa2023,opr2017,opr2018,opr2019,opr2022",
  ...[...teamStats.entries()].map(([team, stats]) => {
    return [
      team,
      stats.points[2017],
      stats.points[2018],
      stats.points[2019],
      stats.points[2022],
      stats.epa[2017],
      stats.epa[2018],
      stats.epa[2019],
      stats.epa[2022],
      stats.epa[2023],
      stats.opr[2017],
      stats.opr[2018],
      stats.opr[2019],
      stats.opr[2022],
    ].join(",");
  }),
].join("\n");

console.log(teamStatsCsv);
