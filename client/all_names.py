import requests
import json



player_names = requests.get(
    f"https://statsapi.web.nhl.com/api/v1/teams?expand=team.roster" #regular season for specified team
    )

output1 = player_names.json()

player_list=[]

teams = output1['teams']
for entry in teams:
    roster = entry['roster']['roster']
    for player in roster:
        player_list.append(player['person']['fullName'])

player_list.sort()

with open('all_names.txt', 'a') as f:
    for entry in player_list:

        f.write(entry)
        f.write('\n')
    