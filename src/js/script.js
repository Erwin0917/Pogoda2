(function(){

///////////////////////////////////////////////////////////////////
// Klasy
//////////////////////////////////////////////////////////////////


class getData {

    static getJSON(url){
        const xhr = new XMLHttpRequest();

        let data = null;

        xhr.open("GET", url);

        let p = new Promise( function(resolve, reject){

            xhr.onreadystatechange = function(){
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                    data = JSON.parse(xhr.response);
                    resolve(data);
                }
            };

            xhr.onerror = function(){
                reject(view.logPanel("Wystąpił błąd pobierania danych"),
                        new Error("Wystąpił błąd pobierania danych"));
            };
        });

        
        


        xhr.send(null);

        return p;
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
        
        
        if( !userCity || !( isNaN(userCity)) ) return view.errorMsg("Podaj poprawną nazwę miasta");
        if( target === btnSerch){
            view.logPanel("Wybranie przycisku Szukaj")
            controller.services.google.findCityGoogle(userCity);
            
        }if( target === btnSearchAndSave ) {
            view.logPanel("Wybranie przycisku Szukaj i zapisz miasto")
            controller.services.google.findCityGoogle(userCity);
            isSaveBtn = true;
     
        }
            

    },
   
    //metoty uruchamiane po otrzymaniu danych z zewnętrznych serwisów
    success:{
        google(data){
            let city = null; 
            if( typeof data.results === "object" ){ 
                
                
                if(data.results.length > 1){
                    city = controller.googleFindMoreThanOne(data.results);
                }else{
                    view.logPanel("Odpowiedz od: GOOGLE MAPS API - znalaziono miasto");
                    controller.findWeather(data.results[0]);                  
                }
                 
                if(city){
                    for(simpleCity of city){
                        findCitiesArr.push(simpleCity);
                    }
                }                       
            }
        },
        openWeatherMap(data){// przekazanie danych z serwisu do sformatowania, nastepnie sformatowane dane do wyswietlenia na stronie
            view.logPanel("Otrzymano dane z serwisu Open Weather Map");

            let current = controller.services.openWeatherMap.currentWeatherFormatObj(data[0]),   //data[0] aktualna pogoda        
                forecast = controller.services.openWeatherMap.forecastFormatObj(data[1]);        //data[1] prognoza pogody       

            view.showWheater(current, forecast ,"Open Weather Map");
            
        },
        wunderground(data){
            console.log(data);
            view.logPanel("Otrzymano dane z serwisu Wunderground");
        },
        apixu(data){
            view.logPanel("Otrzymano dane z serwisu Apixu");
            let current = controller.services.apixu.currentWeatherFormatObj(data[0]),
                forecast = controller.services.apixu.forecastFormatObj(data[1]["forecast"]);

            view.showWheater(current, forecast ,"APIXU");
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
                view.logPanel("Wysłanie zapytania do GOOGLE MAPS API (walidacja nazwy miasta, sprawdzanie czy jest więcej niż jedno miasto z taką nazwą, pobranie współrzędnych geograficznych)")
                getData.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=AIzaSyBOcdzymZk4GJtOABc4LSKl-Ks7ny2HMuk`)
                .then(controller.success.google)
                .catch(this.fail);
                
            }         
        },
        openWeatherMap:{
            api: "f75b72b2175576ad82691adb3942da28",
            getWheater(lat, lon){
                Promise.all([
                    getData.getJSON(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${controller.services.openWeatherMap.api}`),// pobieranie aktualnej pogody
                    getData.getJSON(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pl&appid=${controller.services.openWeatherMap.api}`)//pobieranie prognozy pogody
                ])
                .then(controller.success.openWeatherMap)
                .catch(this.fail);
                               
            }, 
            currentWeatherFormatObj(dataObj){
                view.logPanel("Formatowanie danych otrzymanych od Open Weather Map (pogoda aktualna)");
                
                    let {
                        main:{
                            humidity,
                            pressure,
                            temp
                        },
    
                    } = dataObj;
    
                    temp = (temp - 273.15).toFixed(2);
                    return {temp, pressure, humidity};
                             
            },
            forecastFormatObj(dataObj){
                view.logPanel("Formatowanie danych otrzymanych od Open Weather Map (prognoza pogody)");

                    let forecastArr = [];
                    for (let obj of (dataObj.list) ){
                        
                        if(obj.dt_txt.includes("12:00:00")){
                            let {
                                dt_txt: date,
                                main:{
                                    temp,
                                    humidity,
                                    pressure
                                }
                            } = obj;

                            date = date.slice(0, 10);
                            forecastArr.push({date, temp, pressure, humidity});
                        }

                    }
                    return forecastArr;
                
            }          
        },
        wunderground:{
            api: "3f4302cb35f1273e",
            getWheater(country, city){
                Promise.all([
                    getData.getJSON(`https://api.wunderground.com/api/${controller.services.wunderground.api}/conditions/lang:PL/q/${country}/${city}.json`),
                ])
                .than(controller.success.wunderground)
                .catch(this.fail)
            }
        },
        apixu:{
            api: "05c3f87c24904da4821160047171208",
            getWheater(lat, lon){
                Promise.all([
                    getData.getJSON(`https://api.apixu.com/v1/current.json?key=${controller.services.apixu.api}&q=${lat},${lon}`),
                    getData.getJSON(`https://api.apixu.com/v1/forecast.json?key=${controller.services.apixu.api}&q=${lat},${lon}&days=5`)
                ])
                .then(controller.success.apixu)
                .catch(this.fail)
            },
            currentWeatherFormatObj(dataObj){
                view.logPanel("Formatowanie danych otrzymanych od Apixu (aktualna pogoda)");
                let{
                    current:{
                        humidity,
                        pressure_mb: pressure,
                        temp_c: temp,
                    }
                } = dataObj;

                return {temp, pressure, humidity};
            },
            forecastFormatObj(dataObj){
                view.logPanel("Formatowanie danych otrzymanych od Apixu (prognoza pogody)");
                let forecastArr = [];
                for(let day of dataObj["forecastday"]){
                    let {
                        date,
                        day:{
                            avghumidity: humidity,
                            avgtemp_c: temp
                        }
                    } = day;
                    let pressure = "b/d";
                    forecastArr.push({date, temp, pressure, humidity});
                }
                return forecastArr;
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


        view.logPanel("Odpowiedź od: GOOGLE MAPS API - znaleziono więcej niż jedno miasto");
        return array;
       

    },

    //wybranie miasta z listy znalezionych miast lub zapisanych miast
    selectedCity(e, citiesArr){
        let target = e.target.innerText,
            arrayCity = target.split(","),
            citiesArrTemp = [];

            

            
        
        if( citiesArr.constructor == Storage ){
            view.logPanel("Wybrano miasto z listy zapisanych miast");
            for( let i = 0; i < citiesArr.length; i++ ){
                let city = `city${i}`,
                    parseCity = JSON.parse(citiesArr.getItem(city));
                
                citiesArrTemp.push(parseCity);
            }
            citiesArr = citiesArrTemp;  // jeśli pobieramy dane z local Storage to przypisujemy je do tymczasowej tablicy żeby łatwiej wyciągnąć dane   
        }else view.logPanel("Wybrano miasto z listy znalezionych");

    
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
        console.log(currentCity)
        view.logPanel(`Wybrane miasto to: ${currentCity.formatted_address}`);
        if(isSaveBtn){
            controller.addToSaveCities(currentCity);
        }

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
                view.logPanel("Wysłanie zapytania do seriwsu Open Weather Map");
                this.services.openWeatherMap.getWheater(lat,lon);            
                break;

            case "Wunderground":
                cityName = findLatin(cityName); // usunięcie polskich znaków z nazwy miasta jeśli takie są
                
                view.logPanel("Wysłanie zapytania do seriwsu Wunderground");
                this.services.wunderground.getWheater(country, cityName);
                break;
            
            case "Apixu":
                view.logPanel("Wysłanie zapytania do seriwsu Apixu");               
                this.services.apixu.getWheater(lat, lon);
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
                view.logPanel("Dodanie miasta do pamięci przeglądarki");
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
        view.logPanel("Odczytywanie danych z pamięci przeglądarki");
        let obj = [],
            localLength = localStorage.length;

        for (let i= 0; i < localLength; i++){
            
            obj.push(JSON.parse(localStorage[`city${i}`]));
        }

        return obj;
    },

    //Sprawdzanie jaki serwis został wybrany, zwraca nazwe wybranego serwisu
    selectedServis(){
        view.logPanel("Sprawdzenie jaki serwis pogodowy został wybrany");
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
 
        listElem.innerHTML += elems.join(', ');
        output.appendChild(listElem);
        
    },

    showSaveCities(){
        let cityArr = controller.readFromLocalStorage(),
            citiesList = document.querySelector("#saveCitiesList");

        view.logPanel("Renderowanie zapisanych miast na stronę");
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

    },
    showWheater(current, forecast, serwis){
        view.logPanel("Renderowanie danych pogodowych na stronę");
        const output = document.querySelector(".wheather-container"); 


        // ********************************************** Tworzenie DOM dla aktualnej pogody

        let container = document.createElement("div"); // kontener na informacje pogodowe
        container.className = "wheater";

        let currentContainer = document.createElement("div");//kontener na aktualną pogodę
        currentContainer.className = "current";

        let currentBox = document.createElement("div");// box formatujacy bierzącą pogodę
        currentBox.className = "current-box";

        let title = document.createElement("h3"); // tytuł z jakiego serwisu jest pogoda
        title.innerText = `Pogoda z serwisu ${serwis} dla miasta : ${currentCity.formatted_address}`; 

        let currentListWrap = document.createElement("ul"); // lista z danymi pogodowymi

        for(let info in current){// ustawianie elementów listy z odpowiednimi informacjami dla aktualnej pogody
            let currentListElem = document.createElement("li");
            switch (info){
                case "temp":
                currentListElem.innerText = `Aktualna temperatura: ${current[info]}°C`;
                currentListWrap.appendChild(currentListElem);
                break;

                case "pressure":
                currentListElem.innerText = `Ciśnienie: ${current[info]} hPa`;
                currentListWrap.appendChild(currentListElem);
                break;

                case "humidity":
                currentListElem.innerText = `Wilgotność: ${current[info]}%`;
                currentListWrap.appendChild(currentListElem);
                break;
            }
            
        }

        // ********************************************** Tworzenie DOM dla prognozy pogody

        let forecastContainer = document.createElement("div");//kontener na prognozę pogody
        forecastContainer.className = "forecast";

 


        for(let day of forecast){// ustawianie elementów listy z odpowiednimi informacjami dla prognozy pogody

            let forecastBox = document.createElement("div");// box formatujacy prognoze pogody
            forecastBox.className = "forecast-box";

            let forecastWrap = document.createElement("ul");

            for(let innerDay in day){
                let forecastListElem = document.createElement("li"),
                    date = document.createElement("p");
                switch (innerDay){
                    case "date":
                    date.innerText = day.date;
                    forecastBox.appendChild(date);
                    break;

                    case "temp":
                    forecastListElem.innerText = `${day[innerDay]}°C`;
                    forecastWrap.appendChild(forecastListElem);
                    break;
    
                    case "pressure":
                    forecastListElem.innerText = `${day[innerDay]} hPa`;
                    forecastWrap.appendChild(forecastListElem);
                    break;
    
                    case "humidity":
                    forecastListElem.innerText = `${day[innerDay]}%`;
                    forecastWrap.appendChild(forecastListElem);
                    break;
                }
                forecastBox.appendChild(forecastWrap);
            }
            forecastContainer.appendChild(forecastBox);

        }


        // pogoda aktualna
        currentBox.appendChild(title);
        currentBox.appendChild(currentListWrap); 

        // prognoza pogody


        //łączenie aktualnej
        container.appendChild(currentContainer)
                    .appendChild(currentBox);


        //łączanie prognozy
        container.appendChild(forecastContainer);


        //dodawanie wszystkiego na strone
        output.appendChild(container);

    },
    logPanel(msg, error = null){
        const logContainer = document.querySelector(".logPanel_list");

        let date = new Date(),
            sec = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds(),
            min = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes(),
            time = `${date.getHours()}:${min}:${sec}::${date.getMilliseconds()}ms `

        let logMsg = `<span>${time}</span> -- ${msg}`

        this.addToNode(logContainer, "li", logMsg);
     
        document.querySelector(".logPanel").scrollTop = logContainer.scrollHeight;

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
