load('data_loading.js');

var SOURCE_FILE="seriea.csv";

print("loading data from "+SOURCE_FILE);
var loadedData= loadData(SOURCE_FILE);
print("data loaded");

loadedData.printRatios(loadedData.ratios);

var goalRatios=loadedData.ratios;
var averages=loadedData.averages;

var printJson=function(s) {print(JSON.stringify(s))};


function poisson(k,lambda) {

	var fact=function(n) {
		var f=1;
		for(i=1; i<=n; i++) {
			f=f*i;
		}
		return f;
	};

	return (Math.exp(-1*lambda)*(Math.pow(lambda,k))/(fact(k)));
}

function probabilityOfMatch(homeTeam,awayTeam,homeGoals,awayGoals) {
	var goalExp=goalExpectancy(homeTeam,awayTeam);

	//print("goal exp: "+JSON.stringify(goalExp));
	var pHomeGoals=poisson(homeGoals,goalExp.home);
	var pAwayGoals=poisson(awayGoals,goalExp.away);

	return pHomeGoals*pAwayGoals;
}

function goalExpectancy(homeTeam,awayTeam) {
	var homeR=goalRatios[homeTeam];
	var awayR=goalRatios[awayTeam];

	return {
		home: (homeR.homeAttack*awayR.awayDefence*
				averages.averageGoalsHome).toFixed(2),
		away: (awayR.awayAttack*homeR.homeDefence*
				averages.averageGoalsAway).toFixed(2)
	};
}

function ScoreGeneration() {
	this.h=1;
	this.a=-1;
	var that=this;
	return {
		nextScore: function() {
			if (that.h <= 10) {
				that.a++;
				if (that.a== that.h) {
					that.h++;
					that.a=0;
				}
				if (that.h > 10) {
					return null; 
				} else {
					return {
						h: that.h,
						a: that.a
					};
				}
			} else {
				return null;
			}
		}
	}
}

function invert(score) {
	return {
		h: score.a,
		a: score.h
	}
}

function resolveOutcome(pHome,pAway,pDraw) {
	var outcome="";
	if (pHome > pAway && pHome > pDraw) {
		outcome="1";
	} else if (pAway > pHome && pAway > pDraw) {
		outcome="2";
	} else if (pDraw > pHome && pDraw > pAway) {
		outcome="X";
	} else {
		throw "some probabilities do not match "+pHome+","+
				pAway+", "+pDraw;
	}
	return outcome;
}

function calculateProb(homeTeam,awayTeam) {

	var scoreGeneration = new ScoreGeneration();
	var generateScores = scoreGeneration.nextScore;
	var pHomeWin=0; var pAwayWin=0; var pDraw=0;
	var largestProb=0; var outcome="";
	for (var score=generateScores(); score != null; score=generateScores()) {
		var homeWin=probabilityOfMatch(homeTeam,awayTeam,score.h,score.a);
		if (homeWin > largestProb) {
			largestProb = homeWin;
			outcome="1";
		}
		var awayWin=probabilityOfMatch(homeTeam,awayTeam,score.a,score.h);
		if (awayWin > largestProb) {
			largestProb = awayWin;
			outcome="2";
		}

		pHomeWin+=homeWin;
		pAwayWin+=awayWin;
	}

	for (var score=0; score<=10; score++) {
		var draw=probabilityOfMatch(homeTeam,awayTeam,score,score);
		pDraw+=draw;
		if (draw > largestProb) {
			largestProb = homeWin;
			outcome="X";
		}
	}
	return {
		pHomeWin: pHomeWin,
		pAwayWin: pAwayWin,
		pDraw: pDraw,
		outcome: outcome
	};
}

function printMatchOutcome(teamA,teamB) {
	var prob=calculateProb(teamA,teamB);
	var outcome=resolveOutcome(prob.pHomeWin,prob.pAwayWin,prob.pDraw);
	print (teamA+"-"+teamB+": "+outcome);

}

var matches=[
	["Napoli","Roma"],
	["Pescara","Sampdoria"],
	["Juventus","Udinese"],
	["Fiorentina","Atalanta"],
	["Genoa","Empoli"],
	["Inter","Cagliari"],
	["Lazio","Bologna"],
	["Sassuolo","Crotone"],
	["Chievo","Milan"],
	["Palermo","Torino"]
];

for (var x=0; x<matches.length; x++) {
	printMatchOutcome(matches[x][0],matches[x][1]);
}

