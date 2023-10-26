let session = [];

document.addEventListener('DOMContentLoaded', function() {
    
    //check if theres a session
    
    if (sessionStorage.length>1){
        let key = sessionStorage.key(1);
        let valueString = sessionStorage.getItem(key);
        let value = JSON.parse(valueString); //an array of objects

        value.sort((a, b) => a.num - b.num);
     
        for (let i = 0; i<value.length; i++)
        {
            loadSession(value[i]);
       
        }
    }
    
   
    
    let players = []
    const playerNameElement = document.querySelector('.autocomplete-list')

    //get the elements of the txt file and push to players array
    fetch('all_names.txt')
    .then(response => response.text())
    .then(contents => {
        const lines = contents.split('\n');
        lines.forEach((item)=>{  
            players.push(item);
        })
    })

    document.querySelector('body').addEventListener('click', () => {
        document.querySelector('.autocomplete-list').style.display='none';
    })

    //listen for when user starts typing a player name togive suggestion box
    document.querySelector('#player').addEventListener('input', () => {
        const value = document.querySelector('#player').value;
        //filter player list based on user input
        let filteredPlayers = filterData(players, value);
        
        //load player list into html of suggestion box
        loadPlayers(filteredPlayers, playerNameElement);

    });

    document.querySelector('.autocomplete-list').addEventListener('click', (event) => {
        //user clicked on a persons name, fill innerhtml of player input box to be that name
        document.querySelector('#player').value = event.target.textContent;
        document.querySelector('.autocomplete-list').style.display = 'none';
    })

    //listen for when user submits their bet
    document.querySelector('#submit_button').addEventListener('click', () => get_player_teamID());
    document.querySelector('#clear_button').addEventListener('click', () => clearSession());

  });

  function clearSession()
  {
    //clear bets button clicked, clear session
    if (confirm('Are you sure you want to clear all your bets?'))
    {
        sessionStorage.clear();
        location.reload()
    }
    else
    {
        return;
    }
    
   
  }

  //filters player array based on user input
  function filterData(data, searchText)
  {
    return data.filter((x)=> x.toLowerCase().includes(searchText.toLowerCase()))
  }

  //fills the inner html of the suggestion dropdown using the filtered players array
  function loadPlayers(data, element)
  {
    const value = document.querySelector('#player').value;
    if (value === '')
    {
        document.querySelector('.autocomplete-list').style.display='none';
    }
    else
    {
            let innerElement = '';
            data.forEach((item)=>{  
                innerElement += `<li>${item}</li>`;
            })
            element.innerHTML = innerElement;

        document.querySelector('.autocomplete-list').style.display='block';
        
    }//else close
   
  } //loadPlayers close






  //gets player id, team id
  function get_player_teamID()
  {

    let playerID;
    let teamID;
    //get the values the user has typed in
    const human = document.querySelector('#player').value;
    const menu = document.querySelector('#menu').value;
    const wager = document.querySelector('#wager').value;
    const stat = document.querySelector('#stat').value;

    //if the user left fields blank, alert them
    if (!human || menu == 'What are we betting on?' || wager == 'Prop' || !stat) {
        alert('Please fill out all fields.');
        return; // Do not proceed further
    }
    
    fetch('https://statsapi.web.nhl.com/api/v1/teams?expand=team.roster')
    .then(response => response.json())
    .then(data => 
        {
            let teams = data.teams;

            for (let entry of teams) 
            {
                let roster = entry.roster.roster;
            
                for (let player of roster) 
                {
                    if (player.person.fullName == human) 
                    {
                        playerID = player.person.id;
                        teamID = entry.id;
                        break;
                    }
                }
            }//for loop close
            get_gameID(playerID, teamID);
        })//then data close      

    }//function close

    //using the player & team id from previous function, this function gets the specific game id
    function get_gameID(playerID, teamID)
    {
        
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todaysDate = `${year}-${month}-${day}`;

        let gameID;
        let entry;
        

        fetch(`https://statsapi.web.nhl.com/api/v1/schedule?teamId=${teamID}&startDate=${todaysDate}&endDate=${todaysDate}`)
        .then(response => response.json())
        .then(data => {
            const dates = data.dates;
          
            for (entry of dates) {
                gameID = String(entry.games[0].gamePk);
            }
   
            get_player_data(playerID, gameID);
        })
    }

    //using the playerid and game id from previous functions, this function gets the player data as specified by user i.e points, goals, shots etc
    function get_player_data(playerID, gameID)
    {
        let human = document.querySelector('#player').value;
        const menu = document.querySelector('#menu').value;
        let update;
        let period_interval, period_time, convertedTime;
        let away_score, homeTeam, awayTeam;
        let home_score;
        let whos_winning;

        fetch(`https://statsapi.web.nhl.com/api/v1/game/${gameID}/feed/live`)
        .then(response => response.json())
        .then(data => {
            const liveData = data.liveData;
            let boxscore;
            try{
                boxscore = liveData.boxscore;
            }
            catch(err) 
            {
                alert(`Oops, ${human} doesn't play today.`)
                return;
            }
            const teams = boxscore.teams;
            //get period variables
            plays = liveData.plays
            all_plays = plays.allPlays

            //we only care about the most recent time/period here, therefore take last entry in all_plays array
            //if game didnt start yet, these entries dont exist yet
            try
            {
                period_interval = all_plays[all_plays.length-1].about.period
                period_time = all_plays[all_plays.length-1].about.periodTimeRemaining
                away_score = all_plays[all_plays.length-1].about.goals['away']
                home_score = all_plays[all_plays.length-1].about.goals['home']
                awayTeam = data.gameData.teams.away['abbreviation']
                homeTeam = data.gameData.teams.home['abbreviation']
          
            }
            catch(err)
            {
                //lets get the time of the game
                let game_data = data.gameData.datetime.dateTime;
                let testing = game_data.split('T')[1];
                let working2 = testing.split(':')
                let actual_time = working2[0] + ':' + working2[1]
         

                // Example usage
                const inputTime = actual_time;
                const originalTimeZone = 'UTC';
                const targetTimeZone = 'America/New_York';

                convertedTime = convertTimeToTimeZone(inputTime, originalTimeZone, targetTimeZone);
            
                
            }

            whos_winning = whosWinning(awayTeam, homeTeam, away_score, home_score);
        
            
            // Loop through the away and home teams
       
            for (const entry in teams) 
            {
                const oneSide = teams[entry];
               

                // Now we are in the away or home team's index
                for (const id in oneSide.players) {
                    if (id === `ID${playerID}`) {
                        //points isnt specified in api, need to manually add them
                        if (menu == 'points')
                        {
                            update = parseInt(oneSide.players[id].stats.skaterStats['goals']) + parseInt(oneSide.players[id].stats.skaterStats['assists']);
                        }
                        else
                        {
                            update = oneSide.players[id].stats.skaterStats[menu];
                        }
                        
                        break;
                    }
                }
            }//for loop close
            
            
            loadPlayer(update, playerID, period_interval, period_time, convertedTime, away_score, home_score, whos_winning);

        })//then data close
    }// get_player_data close




function loadSession(obj)
 {

    let human = obj.player;
    let menu = obj.menu;
    let wager = obj.wager;
    let val = obj.value;
    let playerID, teamID;
    let gameID, entry;
    let update;
    let period_interval, period_time, convertedTime; 
    let away_score, homeTeam, awayTeam;
    let home_score;
    let whos_winning;

    let userData = {
        player: human, //player
        menu: menu, //what stat were betting on
        wager: wager, //over or under
        value: val //what theyre hoping player gets
    };

    session.push(userData);
    
    //get player and team ID
    fetch('https://statsapi.web.nhl.com/api/v1/teams?expand=team.roster')
    .then(response => response.json())
    .then(data1 => 
        {
        let teams = data1.teams;

        for (let entry of teams) 
        {
            let roster = entry.roster.roster;
        
            for (let player of roster) 
            {
                if (player.person.fullName == human) 
                {
                    playerID = player.person.id;
                    teamID = entry.id;
                    break;
                }
            }
        }//for loop close

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todaysDate = `${year}-${month}-${day}`;


        fetch(`https://statsapi.web.nhl.com/api/v1/schedule?teamId=${teamID}&startDate=${todaysDate}&endDate=${todaysDate}`)
        .then(response => response.json())
        .then(data2 => 
            {
            const dates = data2.dates;
        
            for (entry of dates) {
                gameID = String(entry.games[0].gamePk);
            }


            fetch(`https://statsapi.web.nhl.com/api/v1/game/${gameID}/feed/live`)
            .then(response => response.json())
            .then(data3 => {
                //get stat variables
                const liveData = data3.liveData;
                const boxscore = liveData.boxscore;
                const teams = boxscore.teams;
                //console.log(data3)
                //get period variables
                plays = liveData.plays
                all_plays = plays.allPlays
                //console.log(all_plays)

                //this block gets the period & game time, as well as score, home and away team
                try
                {
                    period_interval = all_plays[all_plays.length-1].about.period
                    period_time = all_plays[all_plays.length-1].about.periodTimeRemaining
                    away_score = all_plays[all_plays.length-1].about.goals['away']
                    home_score = all_plays[all_plays.length-1].about.goals['home']
                    awayTeam = data3.gameData.teams.away['abbreviation']
                    homeTeam = data3.gameData.teams.home['abbreviation']
                    
                }
                catch(err)
                {
                    //lets get the time of the game
                    let game_data = data3.gameData.datetime.dateTime;
                    let testing = game_data.split('T')[1];
                    let working2 = testing.split(':')
                    let actual_time = working2[0] + ':' + working2[1]
                    

                    // Example usage
                    const inputTime = actual_time;
                    const originalTimeZone = 'UTC';
                    const targetTimeZone = 'America/New_York';

                    convertedTime = convertTimeToTimeZone(inputTime, originalTimeZone, targetTimeZone);
                
                    
                }
                //this var holds the abbreviation of the team thats winning, if tied, its an empty string
                whos_winning = whosWinning(awayTeam, homeTeam, away_score, home_score);
                //console.log(whos_winning);

                // Loop through the away and home teams
                for (const entry in teams) //this loop gets the stat we wanna track i.e shots, assists etc
                {
                    const oneSide = teams[entry];
                

                    // Now we are in the away or home team's index
                    for (const id in oneSide.players) {
                        if (id === `ID${playerID}`) {
                            //points isnt specified in api, need to manually add them
                            if (menu == 'points')
                            {
                                update = parseInt(oneSide.players[id].stats.skaterStats['goals']) + parseInt(oneSide.players[id].stats.skaterStats['assists']);
                            }
                            else
                            {
                                update = oneSide.players[id].stats.skaterStats[menu];
                            }
                            
                            break;
                        }
                    }
                }//for loop close
                
                // Create a new div element, this will be the div where our bets are shown
                const total = document.createElement('div');
                const entry2 = document.createElement('div'); //the main bet div
                const info = document.createElement('div'); // div to align data and period
                const data = document.createElement('div'); //the bet details div
                const period = document.createElement('div'); //period details div
                const progress = document.createElement('div'); //the bet progress div
                const x = document.createElement('button');

                //total is the main
                //entry is a child of total
                //info is a child of entry, image is a child of entry, progress is a child of entry, x button is a child of entry
                //data and period are children of info

                total.appendChild(entry2);
                total.classList.add('entire_entry')

                //add border to each entry & format
                entry2.classList.add('bet_border');

                //player image
                const imgElement = document.createElement('img');
                imgElement.src = `http://nhl.bamcontent.com/images/headshots/current/168x168/${playerID}.jpg`;
                imgElement.classList.add('image_style');
                entry2.appendChild(imgElement);

                // Set the inner HTML of the bet data div which is a child of the entry div 
                data.innerHTML = `<strong style=font-size:large;> ${human} &nbsp</strong> <strong> &nbsp</strong><span style=font-size:large;> ${wager}${val} &nbsp<span style= text-transform:capitalize;>${menu}</span></span>`;
                data.classList.add('bet_entry');
                
                //SET PERIOD VALS HERE
                
                //end of game
                if (parseInt(period_interval) == 3 && period_time == '00:00')
                {
                    period.innerHTML = `<strong>Final: ${home_score}-${away_score} ${whos_winning}</strong>`
                }
                //game didnt start yet
                else if (period_interval == undefined)
                {
                    period.innerHTML = `<strong>Game Starts at ${convertedTime} </strong>`
                }
                else
                {
                    //console.log(`its this ${period_interval}, ${period_time}`)
                    period.innerHTML = `<br>Period: <strong>${period_interval}</strong> <br> Time Remaining: <strong>${period_time}</strong> <br> Score: <strong> ${home_score}-${away_score} ${whos_winning}</strong>` //add here whos winning
                }
                
                period.classList.add('period_entry')

                info.appendChild(data)
                info.appendChild(period)
                entry2.appendChild(info);
                info.classList.add('info_entry');

         
                //set the inner html of the progress of the bet div which is a child of the entry div
                if (update === undefined)
                {
                    progress.innerHTML= 0;
                }
                else{
                    progress.innerHTML= update;
                }
                progress.classList.add('bet_progress')
                
                
                entry2.appendChild(progress);

                //button
                x.innerHTML = `<button type="button" class="btn-close" aria-label="Close"></button>`;
                x.classList.add('close_bet')
                entry2.appendChild(x);
                

                let key = sessionStorage.key(1);
                let valueString = sessionStorage.getItem(key);
                let value = JSON.parse(valueString);
                

                x.addEventListener('click', function() {
                    // Code to be executed when the button is clicked
                    entry2.style.display = 'none';

                    
                    for (let i = 0; i<value.length; i++)
                    {
                        if (value[i].player == human && value[i].menu == menu)
                        {
                            //remove from session array
                            session.splice(i,1)
                            
                            //set new sessionStorage
                            sessionStorage.setItem('sesh', JSON.stringify(session))
                        }
                    }

                });
                    
                // Append the entry div to the document body
                document.querySelector('.bets').appendChild(entry2);

            })//then data3 close

        })//then data2 close
        
    })//then data1 close    
    
 }





//new bet, renders html to display new bet
  function loadPlayer(update, playerID, period_interval, period_time, convertedTime, away_score, home_score, whos_winning)
  {

    let a = sessionStorage.key(1);
    let b = sessionStorage.getItem(a);
    let c = JSON.parse(b);
    
    var checking; //our variable which will show us the order of entry in session
    try
    {
        checking = c.length+1;
    }
    catch(err)
    {
        //this means its our first entry in the session, assign checking val of 1
        checking=1
    }

    const human = document.querySelector('#player').value; //specified player
    const menu = document.querySelector('#menu').value; //shots? goals? assists?
    const wager = document.querySelector('#wager').value; //over or under?
    let val = document.querySelector('#stat').value; //over or under what? 2? 3?


    let userData = {
        num:checking,//will help us with the random order issue hopefully, sort based on this property 
        player: human, //player
        menu: menu, //what stat were betting on
        wager: wager, //over or under
        value: val //what theyre hoping player gets
    };
    
    
     // Create a new div element, this will be the div where our bets are shown
     const total = document.createElement('div');
     const entry = document.createElement('div'); //the main bet div
     const info = document.createElement('div'); // div to align data and period
     const data = document.createElement('div'); //the bet details div
     const period = document.createElement('div'); //period details div
     const progress = document.createElement('div'); //the bet progress div
     const x = document.createElement('button');

     //total is the main
     //entry is a child of total
     //info is a child of entry, image is a child of entry, progress is a child of entry, x button is a child of entry
     //data and period are children of info

     total.appendChild(entry);
     total.classList.add('entire_entry')

     //add border to each entry & format
     entry.classList.add('bet_border');


    //player image
    const imgElement = document.createElement('img');
    imgElement.src = `http://nhl.bamcontent.com/images/headshots/current/168x168/${playerID}.jpg`;
    imgElement.classList.add('image_style');
    entry.appendChild(imgElement);

    // Set the inner HTML of the bet data div which is a child of the entry div 
    data.innerHTML = `<strong style=font-size:large;> ${human} &nbsp</strong> <strong> &nbsp</strong><span style=font-size:large;> ${wager}${val} &nbsp<span style= text-transform:capitalize;>${menu}</span></span>`;
    data.classList.add('bet_entry');
                
    //end of game
    if (parseInt(period_interval) == 3 && period_time == '00:00')
    {
        period.innerHTML = `<strong>Final: ${home_score}-${away_score} ${whos_winning}</strong>`
    }
    //game didnt start yet
    else if (period_interval == undefined)
    {
        period.innerHTML = `<strong>Game Starts at ${convertedTime} </strong>`
    }
    else
    {
        period.innerHTML = `<br>Period: <strong>${period_interval}</strong> <br> Time Remaining: <strong>${period_time}</strong> <br> Score: <strong> ${home_score}-${away_score} ${whos_winning}</strong>` //add here whos winning
    }
    
    period.classList.add('period_entry')

    info.appendChild(data)
    info.appendChild(period)
    entry.appendChild(info);
    info.classList.add('info_entry');
    
    //set the inner html of the progress of the bet div which is a child of the entry div
    if (update === undefined)
    {
        progress.innerHTML= 0;
    }
    else{
        progress.innerHTML= update;
    }
    progress.classList.add('bet_progress')
    
    
    entry.appendChild(progress);

   //button
   x.innerHTML = `<button type="button" class="btn-close" aria-label="Close"></button>`;
   x.classList.add('close_bet')
   entry.appendChild(x);

   //this function deals with new bets, therefore everytime its called add to session    
   session.push(userData);

   // Convert the object to a JSON string and store it in sessionStorage, stores the entire array in sessionStorage
   sessionStorage.setItem('sesh', JSON.stringify(session));
 

   let key = sessionStorage.key(1);
   let valueString = sessionStorage.getItem(key);
   let value = JSON.parse(valueString);
   
   x.addEventListener('click', function() {
       // Code to be executed when the button is clicked
       entry.style.display = 'none';

       //clear from session
       for (let i = 0; i<value.length; i++)
        {
            if (value[i].player == human && value[i].menu == menu)
            {
                //remove from session array
                session.splice(i,1)
                
                //set new sessionStorage
                sessionStorage.setItem('sesh', JSON.stringify(session))
            }
        }

   });
    
    // Append the entry div to the document body
    document.querySelector('.bets').appendChild(entry);
    
    
    document.querySelector('#player').value='';
    //document.querySelector('#menu').value = "What are we betting on?"; // Reset menu to placeholder option
    //document.querySelector('#wager').value = 'Prop'; // Reset wager to placeholder option
    //document.querySelector('#stat').value='';

  }//function close


  //helper functions


  //function which helps us get the time of the game
  function convertTimeToTimeZone(timeString, originalTimeZone, targetTimeZone) 
  {
    // Parse the input time string
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a Date object with the original time and UTC time zone
    const originalDate = new Date(Date.UTC(2023, 9, 25, hours, minutes)); // Month is 0-based (9 represents October)

    // Create a new Date object with the target time and the target time zone
    const targetDate = new Date(originalDate.toLocaleString('en-US', { timeZone: targetTimeZone }));

    // Format the target time as a string
    const targetTimeString = targetDate.toLocaleTimeString([], { timeZoneName: 'short', hour: '2-digit', minute: '2-digit' });

    return targetTimeString;
}

function whosWinning(awayTeam, homeTeam, awayScore, homeScore)
{
    awayScore = parseInt(awayScore);
    homeScore = parseInt(homeScore);
    //this function knows who the away and home team are and what the score is. if tied return empty string
    if (awayScore == homeScore)
    {
        //games tied, show no team
        return '';
    }
    else
    {
        //if not tied, someones winning, find out who
        if (awayScore>homeScore)
        {
            return awayTeam;
        }

        else if(homeScore > awayScore)
        {
            return homeTeam;
        }
    }
}

 
 
