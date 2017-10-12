var questionBank; //variable to hold current question and answer(s)


/***************************************************************************************************
 * model (MVC)
 */

function Model() {
    this.playersInfo = [{points: 0}, {points: 0}, 0]; // player Object index 2 will be 1/2 for player turn and will alternate

    this.questionCount = 0;

    this.playerStats = [{}, {}];
    // sounds for game

    this.soundArray = ['sounds/buzzer.mp3', 'sounds/correct.mp3'];
    this.correctAudioObject = new Audio('sounds/correct.mp3');
    this.wrongAudioObject = new Audio('sounds/buzzer.mp3');
    this.gameAudioObject = new Audio('sounds/ThemeSong.mp3');
    this.gameAudioObject.loop = true;
    this.gameAudioObject.play();
    //used for category # reference
    this.categories = ['General Knowledge', 'Science & Nature', 'History', 'Geography', 'Celebrities', 'Animals', 'Sports', 'Books', 'Music', 'Film'];
    this.categoryNum = [9, 17, 23, 22, 26, 27, 21, 10, 12, 11];
    // variables and methods below received from the view
    this.currentQuestion = null;
    this.currentAnswer = null;
    this.currentWrongAnswers = null;
    this.currentCategory = null;
    this.currentDifficulty = null;

    this.setCurrentQuestion = function(questionString){
        this.currentQuestion = questionString;
    };

    this.setCurrentAnswer = function(correctAnswerString){
        this.currentAnswer = correctAnswerString;
    };

    this.setCurrentWrongAnswers = function(answerArray){
        this.currentWrongAnswers = answerArray;
    };

    this.setCurrentCategory = function(categoryString){
        this.currentCategory = categoryString;
    };

    this.setCurrentDifficulty = function(diffString){
        this.currentDifficulty = diffString;
    };
    /***************************************************************************************************
     * search trivia question API
     * @params {number(category),string(difficulty)} category and difficulty level
     * @returns: {object} question with answers/solution
     * returns an object to view
     */
    this.getTriviaQuestion = function (category, difficultyLevel, callback) {
        console.log('this ran');
        $.ajax({
            url: 'https://opentdb.com/api.php?amount=1&type=multiple',
            data: {
                category: category,  // represented by number
                difficulty: difficultyLevel // string
            },
            dataType: 'json',
            method: 'Post',
            success: function (data) {
                console.log('success', data);
                console.log(data.results[0]);
                questionBank = data.results[0];
                callback(questionBank);
            },
            error: function (data) {
                console.log('something went wrong', data)
            }
        });
    }
    /***************************************************************************************************
     * searchYoutube
     * @params {string} string is question from question list
     * @returns: {URL} Youtube url with relevent material
     * creates a search on youtube from string and returns top video url
     */
    this.searchYoutube = function (string, callback) {
        $.ajax({
            url: 'http://s-apis.learningfuze.com/hackathon/youtube/search.php',
            dataType: 'json',
            data: {
                q: string,
                maxResults: 5,
                type: 'video',
                detailLevel: 'verbose'
            },
            method: 'Post',
            success: function (data) {
                var YTResult = data.data;
                var YTKeys = Object.keys(YTResult);
                var videoId = YTResult[YTKeys[0]].id.videoId;
                console.log('YT success', data);
                console.log('YT first video id', YTResult[YTKeys[0]]);
                console.log('https://www.youtube.com/watch?v=' + videoId);
                // Can't use watch, need to use /embed/
                // callback('https://www.youtube.com/watch?v=' + videoId);
                callback('https://www.youtube.com/embed/' + videoId);
            },
            error: function (data) {
                console.log('something went wrong with YT', data);
            }
        })
    }
    /***************************************************************************************************
     * searchWikipedia
     * @params {string} string; either current question or possible answer
     * @returns: {URL} return wikipedia url
     * searches Wikipedia for relevent article and returns url of article
     */
    this.searchWikipedia = function (string, callback, secondCallback) { //Modified to have a second callback function

        $.ajax({
            url: "https://en.wikipedia.org/w/api.php",
            data: {
                format: "json",
                action: "query",
                prop: 'info',
                list: 'search',
                srsearch: string,
                // section: 0,
                origin: '*'
            },
            success: function (data) {
                console.log('Wiki success', data);
                // callback('https://en.wikipedia.org/?curid=' + data.query.search[0].pageid);
                callback(data.query.search[0].title, secondCallback);
            },
            error: function (data) {
                console.log('wiki fail', data)
            }
        })
    };

    this.getWikipediaText = function (string, callback) {
        $.ajax({
            url: "https://en.wikipedia.org/w/api.php?&section=0",
            data: {
                format: "json",
                action: "parse",
                page: string,
                prop: 'text',
                origin: '*'
            },
            success: function (data) {
                console.log('Wiki text success', data);
                var test = data.parse.text['*'];
                callback(test);
            },
            error: function (data) {
                console.log('wiki fail', data)
            }
        })
    };

    /***************************************************************************************************
     * searchTwitter
     * @params {string}
     * @returns: {text} return text of most recent tweet
     * searches twitter for keywords and returns text of top tweet
     */
    this.searchTwitter = function (string, callback, secondCallback) { //Modified to have a second callback function

        $.ajax({
            url: 'http://s-apis.learningfuze.com/hackathon/twitter/index.php',
            data: {
                search_term: string
            },
            dataType: 'json',
            success: function (data) {
                var tweetData = data.tweets.statuses[0];
                var assembledTweet = 'https://twitter.com/'+tweetData.user.screen_name+'/status/'+tweetData.id_str;

                console.log('embedded tweet url: '+assembledTweet);
                console.log('twitter success', data);
                console.log(data.tweets.statuses[0].text);
                // callback(data.tweets.statuses[0].text);
                callback(assembledTweet, secondCallback);
            },
            error: function (data) {
                console.log('twitter error', data)
            }
        })
    };

    // Must be first callback function of the searchTwitter function.
    // Is used to turn twitter url into embedded html string
    this.getTwitterEmbed = function(string, callback){
        $.ajax({
            url: 'https://publish.twitter.com/oembed?url='+string,
            dataType: 'jsonp', // Ask about 'No 'Access-Control-Allow-Origin' header is present on the requested resource.'
            success: function(data){
                console.log('successfully started embed request!', data);
                var embeddedHTMLCode = data.html;

                callback(embeddedHTMLCode);
            },
            error: function(data){
                console.log('twitter embed request error', data);
            }
        })
    };

   this.updatePlayerInfo = function(playerOnePoint,playerTwoPoint)
   {
       this.playersInfo[0].points = playerOnePoint;
       this.playersInfo[1].points = playerTwoPoint;
   };

   this.updatePlayersStats = function (questionInfo)
   {
       var category;
       switch (questionInfo.category)
       {
           case (9):
               category = "General Knowledge";
               break;
           case (17):
               category = "Science & Nature";
               break;
           case (23):
               category = "History";
               break;
           case (22):
               category = "Geography";
               break;
           case (26):
               category = "Celebrities";
               break;
           case (27):
               category = "Animal";
               break;
           case (21):
               category = "Sports";
               break;
           case (10):
               category = "Books";
               break;
           case (12):
               category = "Musics";
               break;
           case (11):
               category = "Films";
               break;

       }
       this.playerStats[0].category++;
   };

    this.getPlayerName = function(string){
        if (this.playersInfo[2] == 0) {
            this.playersInfo[0].name = string;
        }else{
            this.playersInfo[1].name = string;
        }
    }
}
