load('data_loading.js');

var SOURCE_FILE="seriea.csv";

print("loading data from "+SOURCE_FILE);
var loadedData= loadData(SOURCE_FILE);
print("data loaded");

loadedData.printRatios(loadedData.ratios);

var goalRatios=loadedData.ratios;
var averages=loadedData.averages;

var printJson=function(s) {print(JSON.stringify(s))};

print(JSON.stringify(averages));

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

	var pHomeGoals=poisson(homeGoals,goalExp.home);
	var pAwayGoals=poisson(awayGoals,goalExp.away);

	print("homeGoals= "+pHomeGoals+" "+awayGoals+" "+pAwayGoals);

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
	var gaoExp=probabilityOfMatch(homeTeam,awayTeam,1,1);

	print(JSON.stringify(gaoExp));

	var scoreGeneration = new ScoreGeneration();
	var generateScores = scoreGeneration.nextScore;
	var pHomeWin=0; var pAwayWin=0; var pDraw=0;
	for (var score=generateScores(); score != null; score=generateScores()) {
		var homeWin=probabilityOfMatch(homeTeam,awayTeam,score.h,score.a);
		var awayWin=probabilityOfMatch(homeTeam,awayTeam,score.a,score.h);

		pHomeWin+=homeWin;
		pAwayWin+=awayWin;
	}

	for (var score=0; score<=10; score++) {
		var draw=probabilityOfMatch(homeTeam,awayTeam,score,score);
		pDraw+=draw;
	}
	return {
		pHomeWin: pHomeWin,
		pAwayWin: pAwayWin,
		pDraw: pDraw
	};
}

function printMatchOutcome(teamA,teamB) {
	var prob=calculateProb(teamA,teamB);
	printJson(prob);
	var outcome=resolveOutcome(prob.pHomeWin,prob.pAwayWin,prob.pDraw);
	print (teamA+"-"+teamB+": "+outcome);

}

printMatchOutcome("Lazio","Juventus");

