function loadData(csvPath) {
	var Files=Java.type('java.nio.file.Files');
	var Charset = Java.type('java.nio.charset.Charset'); 
	var Paths=Java.type('java.nio.file.Paths');

	var CSV_COLS = {
		HomeTeam: 2,
		awayTeam: 3,
		homeTeamGoals: 4,
		awayTeamGoals: 5
	};

	function buildGameStatistic(homeTeam,awayTeam,
								homeTeamGoals,awayTeamGoals) {
		return {
			homeTeam: homeTeam,
			awayTeam: awayTeam,
			homeTeamGoals: homeTeamGoals,
			awayTeamGoals: awayTeamGoals
		};
	}

	function loadGameData() {
		var gameDetails=[];
		var lines=Files.newBufferedReader(Paths.get(csvPath),
										  Charset.forName('UTF-8'));


		var line;
		while ((line=lines.readLine())) {
			var splitLine=line.split(",");
			var homeTeam=splitLine[CSV_COLS.HomeTeam]; 
			if (homeTeam && homeTeam.trim()) {
				var gameDetail=buildGameStatistic(homeTeam,
												  splitLine[CSV_COLS.awayTeam],
												  1*splitLine[CSV_COLS.homeTeamGoals],
												  1*splitLine[CSV_COLS.awayTeamGoals]);

				gameDetails.push(gameDetail);
			}
		}

		return gameDetails;
	}

	function updateHomeTeamStats(allTeamStats,teamName) {
		var teamStats=allTeamStats[teamName];
		if (!teamStats) {
			teamStats={played: 0, goalsFor:0, goalAgainst: 0};
			allTeamStats[teamName]=teamStats;
		}
		return teamStats;
	}

	function extractAveragesFromTeamStats(teamStats) {
		total={played: 0, goalsFor:0, goalAgainst: 0, meanGoalsAgainst: 0, meanGoalsFor: 0};
		mean={};
		var count=0;
		for (var teamName in teamStats.teams) {
			var statsOfTeam = teamStats.teams[teamName];
			statsOfTeam.meanGoalsFor=statsOfTeam.goalsFor/statsOfTeam.played;
			statsOfTeam.meanGoalsAgainst=statsOfTeam.goalAgainst/statsOfTeam.played;
			total.played+=statsOfTeam.played;
			total.goalsFor+=statsOfTeam.goalsFor;
			total.goalAgainst+=statsOfTeam.goalAgainst;
			total.meanGoalsAgainst+=statsOfTeam.meanGoalsAgainst;
			total.meanGoalsFor+=statsOfTeam.meanGoalsFor;
			count++;
		}

		teamStats.total=total;
		teamStats.mean={};
		teamStats.mean.played=total.played/count;
		print("average number of games played: " +teamStats.mean.played);
		teamStats.mean.goalsFor=total.goalsFor/teamStats.mean.played;
		teamStats.mean.goalAgainst=total.goalAgainst/teamStats.mean.played;
		teamStats.mean.meanGoalsAgainst=total.meanGoalsAgainst/teamStats.mean.played;
		teamStats.mean.meanGoalsFor=total.meanGoalsFor/teamStats.mean.played;

		return teamStats;
	}

	function collectHomeAwayTeamGoalStatistics(gameData) {
		var homeStats={};
		var awayStats={};
		for (var i in gameData) {
			var game=gameData[i];
			var homeTeamStats=updateHomeTeamStats(homeStats,game.homeTeam)
			homeTeamStats.goalsFor+=game.homeTeamGoals;
			homeTeamStats.goalAgainst+=game.awayTeamGoals;
			homeTeamStats.played++;
			var awayTeamStats=updateHomeTeamStats(awayStats,game.awayTeam)
			awayTeamStats.goalsFor+=game.awayTeamGoals;
			awayTeamStats.goalAgainst+=game.homeTeamGoals;
			awayTeamStats.played++;
		}

		return {
			home: {
				teams: homeStats
			},
			away: {
				teams: awayStats
			}
		};
	}

	function calculateRatios(stats) {
		var ratios={};

		var sortedTeams=Object.keys(stats.teams).sort();
		for(var i in sortedTeams) {
			var teamName = sortedTeams[i];
			ratios[teamName]={};
			var mean=stats.mean.goalsFor;
			print("played: "+stats.teams[teamName].played);
			if (stats.teams[teamName].played < 19) {
				mean=stats.teams[teamName].goalsFor;
			}
			ratios[teamName].attack=
				stats.teams[teamName].goalsFor/mean;

			ratios[teamName].meanGoalsFor=stats.teams[teamName].meanGoalsFor;

			ratios[teamName].defence=
				stats.teams[teamName].goalAgainst/stats.mean.goalAgainst;
		}

		return ratios;
	}

	function printRatios(ratios) {
		for (var teamName in ratios) {
			var teamRatios=ratios[teamName];
			print(teamName+"\t\t"+teamRatios.homeAttack+"\t"+
				teamRatios.homeDefence+"\t"+
				teamRatios.awayAttack+"\t"+
				teamRatios.meanGoalsHome+"z\t"+
				teamRatios.meanGoalsAway+"\t"+
				teamRatios.awayDefence);
		}

	}

	function extractRatios(homeSt,awaySt) {
		var ratios={};
		for(var teamName in homeSt) {
			ratio={};
			var homeStats=homeSt[teamName];
			var awayStat=awaySt[teamName];
			ratio.homeAttack=homeStats.attack.toFixed(2);
			ratio.homeDefence=homeStats.defence.toFixed(2);
			ratio.awayAttack=awayStat.attack.toFixed(2);
			ratio.awayDefence=awayStat.defence.toFixed(2);
			ratio.meanGoalsHome=homeStats.meanGoalsFor.toFixed(2);
			ratio.meanGoalsAway=awayStat.meanGoalsFor.toFixed(2);

			ratios[teamName]=ratio;

		}

		return ratios;
	}

	var gameData=loadGameData();
	var allStats = collectHomeAwayTeamGoalStatistics(gameData);

	var homeStats=extractAveragesFromTeamStats(allStats.home);
	var awayStats=extractAveragesFromTeamStats(allStats.away);

	var averages= {
		averageGoalsHome: homeStats.mean.meanGoalsFor.toFixed(2),
		averageGoalsAway: awayStats.mean.meanGoalsFor.toFixed(2)
	};

	var homeRatios=calculateRatios(homeStats);
	var awayRatios=calculateRatios(awayStats);

	var homeAwayRatios=extractRatios(homeRatios,awayRatios);

	return {
		ratios: homeAwayRatios,
		printRatios:printRatios,
		averages: averages
	};


}