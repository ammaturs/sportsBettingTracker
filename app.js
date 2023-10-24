//TODO
//session storage so if a user refreshes the page their stuffs still there
//constantly checking for api updates i.e when a user scores etc
let session = [];
//sessionStorage.clear()

document.addEventListener('DOMContentLoaded', function() {
    
    //check if theres a session
    console.log('loaded11')
    if (sessionStorage.length>0){
        let key = sessionStorage.key(0);
        let valueString = sessionStorage.getItem(key);
        let value = JSON.parse(valueString);
        console.log(`here: ${value}`)
        for (let i =0; i<value.length; i++)
        {
            console.log(`heyy`);
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
  });



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
        const menu = document.querySelector('#menu').value;
        let update;

        fetch(`https://statsapi.web.nhl.com/api/v1/game/${gameID}/feed/live`)
        .then(response => response.json())
        .then(data => {
            const liveData = data.liveData;
            const boxscore = liveData.boxscore;
            const teams = boxscore.teams;
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
            
            
            loadPlayer(update, playerID);

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
                const liveData = data3.liveData;
                const boxscore = liveData.boxscore;
                const teams = boxscore.teams;
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
                
                // Create a new div element, this will be the div where our bets are shown
                const total = document.createElement('div');
                const entry2 = document.createElement('div'); //the main bet div
                const data = document.createElement('div'); //the bet details div
                const progress = document.createElement('div'); //the bet progress div
                const x = document.createElement('button');

                total.appendChild(entry2);
                total.style.display = 'block';

                //add border to each entry & format
                entry2.classList.add('bet_border');
                entry2.style.display = 'flex'; 

                //player image
                const imgElement = document.createElement('img');
                imgElement.src = `http://nhl.bamcontent.com/images/headshots/current/168x168/${playerID}.jpg`
                entry2.appendChild(imgElement);
                console.log('passed')

                // Set the inner HTML of the bet data div which is a child of the entry div 
                data.innerHTML = `<span id=bet_entry> <strong> ${human} &nbsp &nbsp &nbsp &nbsp</strong> <strong> &nbsp</strong> ${wager}${val} &nbsp<span style= text-transform:capitalize;>${menu}</span> </span>`;
            
                //format bet details
                entry2.appendChild(data);
                //data.style.display = 'block';
                
                //set the inner html of the progress of the bet div which is a child of the entry div
                if (update === undefined)
                {
                    progress.innerHTML= `<span id = progress>0 out of ${val}</span>`;
                }
                else{
                    progress.innerHTML= `<span id = progress>${update} out of ${val}</span>`;
                }

                progress.style.textAlign = 'right';
                
                entry2.appendChild(progress);

                //button
                x.innerHTML = `<button id="close_bet" type="button" class="btn-close" aria-label="Close"></button>`;
                x.style.marginRight = '10px'; 
                x.style.textAlign = 'right';
                entry2.appendChild(x);
                

                let key = sessionStorage.key(0);
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
  function loadPlayer(update, playerID)
  {
    console.log('loadPlayer');

    const human = document.querySelector('#player').value; //specified player
    const menu = document.querySelector('#menu').value; //shots? goals? assists?
    const wager = document.querySelector('#wager').value; //over or under?
    let val = document.querySelector('#stat').value; //over or under what? 2? 3?


    let userData = {
        player: human, //player
        menu: menu, //what stat were betting on
        wager: wager, //over or under
        value: val //what theyre hoping player gets
    };
    
    
    // Create a new div element, this will be the div where our bets are shown
    const total = document.createElement('div');
    const entry = document.createElement('div'); //the main bet div
    const data = document.createElement('div'); //the bet details div
    const progress = document.createElement('div'); //the bet progress div
    const x = document.createElement('button');

    total.appendChild(entry);
    total.style.display = 'block';

    //add border to each entry & format
    entry.classList.add('bet_border');
    entry.style.display = 'flex'; 

    //player image
    const imgElement = document.createElement('img');
    imgElement.src = `http://nhl.bamcontent.com/images/headshots/current/168x168/${playerID}.jpg`
    entry.appendChild(imgElement);
    console.log('passed')

    // Set the inner HTML of the bet data div which is a child of the entry div 
    data.innerHTML = `<span id=bet_entry> <strong> ${human} &nbsp &nbsp &nbsp &nbsp</strong> <strong> &nbsp</strong> ${wager}${val} &nbsp<span style= text-transform:capitalize;>${menu}</span> </span>`;
   
    //format bet details
    entry.appendChild(data);
    //data.style.display = 'block';
    
    //set the inner html of the progress of the bet div which is a child of the entry div
   if (update === undefined)
   {
    progress.innerHTML= `<span id = progress>0 out of ${val}</span>`;
   }
   else{
    progress.innerHTML= `<span id = progress>${update} out of ${val}</span>`;
   }

   progress.style.textAlign = 'right';
   
   entry.appendChild(progress);

   //button
   x.innerHTML = `<button id="close_bet" type="button" class="btn-close" aria-label="Close"></button>`;
   x.style.marginRight = '10px'; 
   x.style.textAlign = 'right';
   entry.appendChild(x);

   //this function deals with new bets, therefore everytime its called add to session    
   session.push(userData);

   // Convert the object to a JSON string and store it in sessionStorage, stores the entire array in sessionStorage
   sessionStorage.setItem('sesh', JSON.stringify(session));

   let key = sessionStorage.key(0);
   let valueString = sessionStorage.getItem(key);
   let value = JSON.parse(valueString);
   console.log(`here: ${valueString}`)
   
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
    document.querySelector('#menu').value = "What are we betting on?"; // Reset menu to placeholder option
    document.querySelector('#wager').value = 'Prop'; // Reset wager to placeholder option
    document.querySelector('#stat').value='';

  }//function close

 
 
