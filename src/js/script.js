// ***********   Dodawanie do zapisanych z listy znalezionym wielu miast




(function(){

///////////////////////////////////////////////////////////////////
// Klasy
//////////////////////////////////////////////////////////////////


class getData {

    static getJSON(url, success, fail){
        const xhr = new XMLHttpRequest();

        let data = null;

        xhr.open("GET", url, false);

        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                data = JSON.parse(xhr.response);
                controller.success(data);
            }
        };
        xhr.onerror = function(error){
            controller.fail(error);
        };


        xhr.send(null);
    }

}


///////////////////////////////////////////////////////////////////
// Zmienne globalnego zastosowania
//////////////////////////////////////////////////////////////////




const  btnSerch = document.querySelector('#searchCityBtn'),
        btnSearchAndSave =  document.querySelector('#searchAndSaveCityBtn'),
        outputFindMoreContainer = document.querySelector(".cityChoose"),
        saveCitiesContainer = document.querySelector(".saveCities"),
        findCitiesArr = [];


let   currentCity = null;


///////////////////////////////////////////////////////////////////
// Działanie aplikacji
//////////////////////////////////////////////////////////////////

const controller = {

    //uruchamianie wszystkich zależności
    run(e){
        view.hidden(outputFindMoreContainer);
        
        

        let target = e.target, 
            input = document.querySelector('#citySearch'),
            userCity = (input.value).trim();
        
        
        if( !userCity || !( isNaN(userCity)) ) return view.errorMsg("Podaj poprawną nazwę miasta"); //********* do poprawy walidacja  
            
        if( target === btnSerch){
            controller.services.google.findCityGoogle(userCity);
            
        }if( target === btnSearchAndSave ) {
            controller.services.google.findCityGoogle(userCity);
            controller.addToSaveCities(currentCity);
        }
            

    },
   
    //funkcja uruchamiana po poprawnym otrzymaniu danych z serwisów, sprawdza z jakiego serwisu są dane
    success(data){
        if( typeof data.results === "object" ){ // object od google !! objekt z pola "Wyszukaj miasto" !!
            let city =  (data.results.length > 1) ? this.googleFindMoreThanOne(data.results) : this.findWeather(data.results[0]);
            if(city){
                for(simpleCity of city){
                findCitiesArr.push(simpleCity);
                }
            }
            
            
        }else{



            // *************  


        }
    },

    //funkcja uruchamiana gdy otrzymujemy bład podczas XMLHttpRequest
    fail(error){
        console.log(error);
    },
    
    //metoda dla różnych serwisów
    services:{
        //metody dla wyszukiwania w google api
        google:{
            //sprawdzanie miasta w google maps api
            findCityGoogle(city){
                getData.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=AIzaSyBOcdzymZk4GJtOABc4LSKl-Ks7ny2HMuk`, this.success, this.fail);
            }         
        }
    },
    
    //metoda jeśli google znajdzie więcej niż jedno miasto
    googleFindMoreThanOne(array){
        let outputList = document.querySelector("#cityChooseList"),
            cityName = null,
            provinceName = null,
            countryName = null;


        view.clear(outputList);
        outputFindMoreContainer.classList.remove("hidden");   


        for(let singleCity of array){
            let listElement = document.createElement("li");

            cityName = singleCity.address_components[0].long_name,
            provinceName = singleCity.address_components[1].short_name,
            countryName = singleCity.address_components[3].short_name;

            listElement.innerText = `${cityName}, ${provinceName}, ${countryName}`;
            outputList.appendChild(listElement);
        }


         
        return array;
       

    },

    //wybranie miasta z listy znalezionych miast lub zapisanych miast
    selectedCity(e, citiesArr){
        let target = e.target.innerText,
            arrayCity = target.split(","),
            citiesArrTemp = [];

            console.log(target);

            
        
        if( citiesArr.constructor == Storage ){
            for( let i = 0; i < citiesArr.length; i++ ){
                let city = `city${i}`,
                    parseCity = JSON.parse(citiesArr.getItem(city));
                
                citiesArrTemp.push(parseCity);
            }
            citiesArr = citiesArrTemp;  // jeśli pobieramy dane z local Storage to przypisujemy je do tymczasowej tablicy żeby łatwiej wyciągnąć dane   
        }

        
        

        for(let cityObj of citiesArr){


            if(arrayCity[0] == cityObj.address_components[0].long_name && arrayCity[1].trim() == cityObj.address_components[1].short_name){
                view.hidden(outputFindMoreContainer);
                this.findWeather(cityObj);
                console.log(cityObj);
                
            }

        }

        
        
    },

    //metoda jeśli zostało wybrane konkretne miasto
    findWeather(cityObj){
        currentCity = cityObj;
        
    },

    //dodawanie miasta do zapisanej listy
    addToSaveCities(cityObj){

        let { address_components : {
                        0 : {
                            short_name : city
                        },
                        1 : {
                            short_name : province
                        },
                        3 : {
                            short_name : country
                        } 
                    }
            } = cityObj || {};

        let citiesList = document.querySelector("#saveCitiesList"),
            
            storageLength =  window.localStorage.length;
        
        
        
        if( window.localStorage ){
            let storageLength = localStorage.length;

            for(let i = 0; i <= storageLength; i++){
                
                if(storageLength > 0 ){ // jeśli jest już jakieś miasto zapisane w localStorage to sprawdź czy aktualnie zapisywane nie powiela się.
                    
                    let beforeObj = JSON.parse(localStorage.getItem(`city${storageLength-1}`) ),
                        eachObj = JSON.parse(localStorage.getItem(`city${i}`) );

                    let     { address_components : {
                            0 : {
                                short_name : cityEachObj
                            },
                            1 : {
                                short_name : provinceEachObj
                            } 
                        }
                    } = eachObj;

                    let { address_components : {
                            0 : {
                                short_name : cityBeforeObj
                            },
                            1 : {
                                short_name : provinceBeforeObj
                            } 
                        }
                    } = beforeObj;
                    

                    
                    
                    if( city ==  cityBeforeObj &&  province == provinceBeforeObj ) return;  // sprawdzenie czy poprzedni objekt jest taki sam jak aktualnie szukany jesli tak to nie dodajemy do local storage

                    for(let i = 0; i <= storageLength; i++){
                        if(city ==  cityEachObj && province ==  provinceEachObj) return;  // sprawdzanie czy którykolwiek objekt jest taki sam jak aktualnie szukany jesli tak nie dodajemy do local storage
                    }
                               
                }
                
                localStorage.setItem(`city${storageLength}`, JSON.stringify(cityObj) ); // dodanie zapisanego miasta do localStorage
                view.addToNode(citiesList, "li", city, province, country); // dodanie zapisanego miasta do DOM
                
            }
            
            
            

        }else{
            alert("Twoja przeglądarka ma wyłączony zapis w LOCAL STORAGE. Aktualnie nie można dodać do zapisanych żadnego miasta.");
        }


        saveCitiesContainer.classList.remove("hidden");

    },


    // odczytywanie miast z local storage i przekazywanie ich w postaci tablicy
    readFromLocalStorage(){
        let obj = [],
            localLength = localStorage.length;

        for (let i= 0; i < localLength; i++){
            
            obj.push(JSON.parse(localStorage[`city${i}`]));
        }

        return obj;
    }

    

};



///////////////////////////////////////////////////////////////////
// renderowanie widoku
//////////////////////////////////////////////////////////////////


const view = {

    //wyświetlanie alertu 
    errorMsg(msg){
        alert(msg);
    },

    //funkcja do czyszczenia elementów przy kolejnym wyszukiwaniu
    clear(elem){
        elem.innerHTML = "";
    },

    //ukrywaj elementy w DOM
    hidden(elem){
        elem.classList.add("hidden");
    },
    addToNode(output, container, ...elems){

        let listElem = document.createElement(container);
            elems.forEach(function(elem){
                listElem.innerText += `${elem}, `;
            });
            output.appendChild(listElem);
        return;
    },

    showSaveCities(){
        let cityArr = controller.readFromLocalStorage(),
            citiesList = document.querySelector("#saveCitiesList");

        cityArr.forEach( function(elem){
            let { address_components : {
                        0 : {
                            short_name : city
                        },
                        1 : {
                            short_name : province
                        },
                        3 : {
                            short_name : country
                        } 
                    }
            } = elem;
            view.addToNode(citiesList, "li", city, province, country);
        });

    }
};




///////////////////////////////////////////////////////////////////
///Uruchamianie aplikacji
//////////////////////////////////////////////////////////////////




if( window.localStorage.length > 0 ){
    saveCitiesContainer.classList.remove("hidden");
    view.showSaveCities();    
}


btnSerch.addEventListener('click', controller.run, false);


btnSearchAndSave.addEventListener('click', controller.run, false);


outputFindMoreContainer.addEventListener('click',function(e){
    controller.selectedCity(e, findCitiesArr);
}, false);

saveCitiesContainer.addEventListener('click',function(e){
    controller.selectedCity(e, localStorage);
}, false);


})();
