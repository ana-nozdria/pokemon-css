window.addEventListener("load", function(){

    // Your client-side JavaScript here
    // All data from the server must be accessed via AJAX fetch requests.

    displayAllPokemons();
    loadRandomPok();

    let clickedCell = null;
    const offenceSection = document.querySelector('#on-offence');
    const defenceSection = document.querySelector('#on-defence');

    //Pokemon info elements
    const name = document.querySelectorAll('.pokemon-name');
    const pokedexNum = document.querySelector('#pokedex-num')
    const image = document.querySelector('#pokemon-img');
    const desc = document.querySelector('#description-text');
    const type = document.querySelector('#type-info');

    //Start of favourites section
    const likeBtn = document.querySelector('#fav-pokemon');
    let likedPokemons = JSON.parse(localStorage.getItem('likedPokemons')) || [];
    updateLikedColumn();

    likeBtn.addEventListener('click', function () {
        const isLiked = isPokemonLiked(pokedexNum.innerHTML);

    
        if (isLiked) {
            unlikeAPokemon(pokedexNum.innerHTML);
            likeBtn.classList.remove('likedBtn');
            likeBtn.title = `I like this one!`;
        } else {
            likeAPokemon(pokedexNum.innerHTML, image.src);
            likeBtn.classList.add('likedBtn');
            likeBtn.title = `Nah, I don't like it anymore.`;
        }
    
        updateLikedColumn();
    });
    
    function isPokemonLiked(dex) {
        return likedPokemons.some(pokemon => pokemon.dexNum == dex);
    }

    function likeAPokemon(dex, imageSrc) {
        likedPokemons.push({ dexNum: dex, image: imageSrc });
        saveFavList();
    }

    function unlikeAPokemon(dex) {
        const index = likedPokemons.findIndex(pokemon => pokemon.dexNum == dex);
        if (index !== -1) {
            likedPokemons.splice(index, 1);
            saveFavList();
        }
    }
    
    function updateLikedColumn() {
        const favs = document.querySelector('#fav-table');
        favs.innerHTML = '';
    
        likedPokemons.forEach(pokemon => {
          const favRow = document.createElement('tr');
          const favCell = document.createElement('td');
    
          favCell.innerHTML = `<img src='${pokemon.image}'>`;
          favRow.appendChild(favCell);
          favs.appendChild(favRow);

          favRow.addEventListener('click', function() {
            likeBtn.classList.add('likedBtn');
            changeCellStyle(favCell);
            getPokemonInfo(pokemon.dexNum);
          })
        });
    }
    //End of favourites section

    //I chose to go with local storage
    function saveFavList() {
        localStorage.setItem('likedPokemons', JSON.stringify(likedPokemons));
    }

    //Start of the main function - display Pokemons
    async function displayAllPokemons() {
        let namesResponseObj = await fetch(`https://cs719-a01-pt-server.trex-sandwich.com/api/pokemon`);
        let namesArray = await namesResponseObj.json();

        for (let i = 0; i < namesArray.length; i++) {

            const theList = document.querySelector('#left-table');
            const namesRow = document.createElement('tr');
            const namesCell = document.createElement('td');

            namesCell.innerHTML += namesArray[i].name;
            namesRow.appendChild(namesCell);
            theList.appendChild(namesRow);

            namesRow.addEventListener('click', function() {
                const dexNumber = namesArray[i].dexNumber;

                if (isPokemonLiked(dexNumber)) {
                    likeBtn.classList.add('likedBtn');
                } else {
                    likeBtn.classList.remove('likedBtn');
                }

                changeCellStyle(namesCell);
                getPokemonInfo(dexNumber);
            });
        }
    }

    function changeCellStyle(cell) {
        if (clickedCell) {
            clickedCell.classList.remove('clickedCell');
        }

        clickedCell = cell;
        clickedCell.classList.add('clickedCell'); 
    }

    async function loadRandomPok() {
        let randomPokRes = await fetch(`https://cs719-a01-pt-server.trex-sandwich.com/api/pokemon/random`);
        let randomPokObj = await randomPokRes.json();

        await getPokemonInfo(randomPokObj.dexNumber);
    }

    async function getPokemonInfo(dexNum) {
        let infoResponseObj = await fetch(`https://cs719-a01-pt-server.trex-sandwich.com/api/pokemon/${dexNum}`);
        let infoObj = await infoResponseObj.json();

        name.forEach(name => {
            name.innerHTML = infoObj.name;
        });
        pokedexNum.innerHTML = infoObj.dexNumber;
        image.src = infoObj.imageUrl;
        desc.innerHTML = infoObj.dexEntry;
        type.innerHTML = infoObj.types.join(', ');
        type.style.fontWeight = 'bold';

        offenceSection.innerHTML = '';
        defenceSection.innerHTML = '';

        infoObj.types.forEach(typeName => {
            const offenceTable = document.createElement('table');
            offenceSection.appendChild(offenceTable);
            
            populateTabHeader(typeName, offenceTable, true);
            populateTable(typeName, offenceTable, true);
        });

        populateTabHeader(null, defenceSection, false);
        await populateTable(dexNum, defenceSection, false);
    }
    //End of the main function

    //Start of stats tables
    function populateTabHeader(typeName, tableId, isOffence) {
        const header = document.createElement('thead');
        const row = document.createElement('tr');
        const leftHeaderCell = document.createElement('th');
        const rightHeaderCell = document.createElement('th');

        header.innerHTML = isOffence ? `<th colspan = "2">${typeName} type attacks: </th>` : null;
        leftHeaderCell.innerHTML = `Defending type`;
        rightHeaderCell.innerHTML = isOffence ? `Damage dealt` : `Damage received`;
    
        tableId.appendChild(header);
        header.appendChild(row);
        row.appendChild(leftHeaderCell);
        row.appendChild(rightHeaderCell);
    }

    //I'm especially proud of this one - -50 lines of code!
    async function populateTable(dataType, tableId, isOffence) {
        const apiUrl = isOffence
            ? `https://cs719-a01-pt-server.trex-sandwich.com/api/types/${dataType}`
            : `https://cs719-a01-pt-server.trex-sandwich.com/api/pokemon/${dataType}/defense-profile`;

        let dataResponseObj = await fetch(apiUrl);
        let statsData = await dataResponseObj.json();
        const statsType = isOffence ? statsData.offenseDamageMultipliers : statsData;

        statsType.forEach(el => {
            const row = document.createElement('tr');
            const leftColumn = document.createElement('td');
            const rightColumn = document.createElement('td');
    
            leftColumn.innerHTML = el.type;
            rightColumn.innerHTML = el.multiplier;
    
            row.appendChild(leftColumn);
            row.appendChild(rightColumn);
            tableId.appendChild(row);
    
            translateMultiplier(el.multiplier, rightColumn);
        })
    }

    function translateMultiplier(multiplier, cell) {
        if(multiplier == '0') {
            cell.innerHTML = 'No damage';
        } else if (multiplier == '0.25') {
            cell.innerHTML = 'Quarter damage';
        } else if (multiplier == '0.5') {
            cell.innerHTML = 'Half damage';
        } else if (multiplier == '1') {
            cell.innerHTML = 'Normal damage';
        } else if (multiplier == '2') {
            cell.innerHTML = 'Double damage';
        } else if (multiplier == '4') {
            cell.innerHTML = 'Quadruple damage';
        }
    }
    //End of stats tables
});