// ***********   Przekazanie informacji do pierwszego serwisu pogodowego




(function(){

///////////////////////////////////////////////////////////////////
// Klasy
//////////////////////////////////////////////////////////////////


class getData {

    static getJSON(url, successFn, failFn){
        const xhr = new XMLHttpRequest();

        let data = null;

        xhr.open("GET", url, false);

        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                data = JSON.parse(xhr.response);
                successFn(data);
            }
        };
        xhr.onerror = function(error){
            failFn(error);
        };


        xhr.send(null);
    }

}
///////////////////////////////////////////////////////////////////
// Pomocnicze
//////////////////////////////////////////////////////////////////
function replaceLatin(w) {
    
        if (w) {
    
            if (w === "ę") return "e";
            if (w === "ó") return "o";
            if (w === "ą") return "a";
            if (w === "ś") return "s";
            if (w === "ł") return "l";
            if (w === "ż") return "z";
            if (w === "ź") return "z";
            if (w === "ć") return "c";
            if (w === "ń") return "n";
        }
    
    };
    function findLatin(string) {
        let reg = /[ęóąśłżźćń]/ig;
        string = string.toLowerCase();
        let stringArr = [...string],
            newString = "";
    
    
        for (let w of stringArr) {
            w = w.replace(reg, replaceLatin(w));
    
            newString += w;
        }
        if (newString) {
            return newString;
        }
    
    
    };



///////////////////////////////////////////////////////////////////
// Zmienne globalnego zastosowania
//////////////////////////////////////////////////////////////////




const  btnSerch = document.querySelector('#searchCityBtn'),
        btnSearchAndSave =  document.querySelector('#searchAndSaveCityBtn'),
        outputFindMoreContainer = document.querySelector(".cityChoose"),
        saveCitiesContainer = document.querySelector(".saveCities"),
        findCitiesArr = [];

let    currentCity = null,
       isSaveBtn = false;


///////////////////////////////////////////////////////////////////
// Działanie aplikacji
//////////////////////////////////////////////////////////////////

const controller = {

    //uruchamianie wszystkich zależności
    run(e){
        view.hidden(outputFindMoreContainer);
        isSaveBtn = false;
        
        

        let target = e.target, 
            input = document.querySelector('#citySearch'),
            userCity = (input.value).trim();
        
        
        if( !userCity || !( isNaN(userCity)) ) return view.errorMsg("Podaj poprawną nazwę miasta"); //********* do poprawy walidacja  
            
        if( target === btnSerch){
            controller.services.google.findCityGoogle(userCity);
            
        }if( target === btnSearchAndSave ) {
            controller.services.google.findCityGoogle(userCity);
            isSaveBtn = true;
            try {
                controller.addToSaveCities(currentCity);
            } catch (e) {
                // nic nie rob 
            }

            
        }
            

    },
   
    //metoty uruchamiane po otrzymaniu danych z zewnętrznych serwisów
    success:{
        google(data){
            if( typeof data.results === "object" ){ 
                let city =  (data.results.length > 1) ? controller.googleFindMoreThanOne(data.results) : controller.findWeather(data.results[0]);
                if(city){
                    for(simpleCity of city){
                        findCitiesArr.push(simpleCity);
                    }
                }                       
            }else{
                console.log("Google API Error");
            }
        },
        openWeatherMap(data){// przekazanie danych z serwisu do sformatowania, nastepnie sformatowane dane do wyswietlenia na stronie
            let obj = controller.services.openWeatherMap.currentWeatherFormatObj(data);
            console.log(`Z Open Weather: ${obj}`);
        },
        wunderground(data){
            console.log(data);
        },
        apixu(data){
            let obj = controller.services.apixu.currentWeatherFormatObj(data);
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
                getData.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=AIzaSyBOcdzymZk4GJtOABc4LSKl-Ks7ny2HMuk`, controller.success.google, this.fail);
            }         
        },
        openWeatherMap:{
            api: "f75b72b2175576ad82691adb3942da28",
            getCurrent(lat, lon){
                getData.getJSON(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${controller.services.openWeatherMap.api}`, controller.success.openWeatherMap, this.fail);
            },
            currentWeatherFormatObj(dataObj){
                
                let {
                    main:{
                        humidity,
                        pressure,
                        temp
                    },

                } = dataObj;

                temp = (temp - 273.15).toFixed(2);
                
                return {humidity, pressure, temp};
            }
        },
        wunderground:{
            api: "3f4302cb35f1273e",
            getCurrent(country, city){
                getData.getJSON(`https://api.wunderground.com/api/${controller.services.wunderground.api}/conditions/lang:PL/q/${country}/${city}.json`, controller.success.wunderground, this.fail);
            }
        },
        apixu:{
            api: "05c3f87c24904da4821160047171208",
            getCurrent(city){
                getData.getJSON(`http://api.apixu.com/v1/current.json?key=${controller.services.apixu.api}&q=${city}`, controller.success.apixu, this.fail);
            },
            currentWeatherFormatObj(dataObj){
                
                let{
                    current:{
                        humidity,
                        pressure_mb: pressure,
                        temp_c: temp,
                    }
                } = dataObj;

                return {humidity, pressure, temp};
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

                if(isSaveBtn){//jeśli było naciśniecie przycisku zapisz dodaje z listy znalezionych do zapisanych
                    controller.addToSaveCities(cityObj);
                }
                
            }

        }

        
        
    },

    //metoda jeśli zostało wybrane konkretne miasto
    findWeather(cityObj){
        currentCity = cityObj;

        let servis = this.selectedServis();

        let {geometry:{
                location:{
                    lat,
                    lng:lon
                    }
            },
            address_components:{
                0:{
                    long_name:cityName
                },
                3:{
                    short_name:country
                }
            }

        } = cityObj;
        
        
        switch (servis) {
            case "OpenWeatherMap":
                this.services.openWeatherMap.getCurrent(lat,lon);               
                break;

            case "Wunderground":
                cityName = findLatin(cityName);
                
                this.services.wunderground.getCurrent(country, cityName);
                break;
            
            case "Apixu":               
                this.services.apixu.getCurrent(cityName);
                break;
        }
        
        
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
    },

    //Sprawdzanie jaki serwis został wybrany, zwraca nazwe wybranego serwisu
    selectedServis(){
        let servis,
            servList = document.querySelectorAll(".chooseSerwis input");

            for(let elem of servList){
                if(elem.checked){
                    servis = elem.value;
                }
            }
        return servis;
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
 
        listElem.innerText += elems.join(', ');
        output.appendChild(listElem);
        
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
