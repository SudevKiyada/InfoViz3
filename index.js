
let prodMovies = [], movieData = [], prodCompanies = [], eventsArray = [], calendarData = [], eventsData = [], debutData = [], genreData = [];

eventsArray = ["Diwali/Deepavali", "Ramzan Id/Eid-ul-Fitar", "Christmas", "Valentine's Day", "Republic Day", "Independence Day", "Holi", "Dussehra"];

// Toggle variable to toggle between movies and debutants
let toggle = false;
let genreToggle = false;
let attached = false;

// d3.json('https://raw.githubusercontent.com/SudevKiyada/InfoViz3/main/prodCompanies.json', d3.autoType),
// d3.json('https://raw.githubusercontent.com/SudevKiyada/InfoViz3/main/movieData.json', d3.autoType),
// d3.json('https://raw.githubusercontent.com/SudevKiyada/InfoViz3/main/debuts.json', d3.autoType),
// d3.csv('https://raw.githubusercontent.com/SudevKiyada/InfoViz3/main/calendar.csv', d3.autoType),

// using d3 for convenience
var main = document.querySelector("main");
var scrolly = main.querySelector("#scrolly");
var sticky = scrolly.querySelector(".sticky-thing");
var article = scrolly.querySelector("article");
var steps = article.querySelectorAll(".step");

// // initialize the scrollama
// var scroller = scrollama();

// // scrollama event handlers
// function handleStepEnter(response) {
//   // response = { element, direction, index }
//   var el = response.element;

//   // remove is-active from all steps
//   // then add is-active to this step
//   steps.forEach(step => step.classList.remove('is-active'));
//   el.classList.add('is-active');

//   // update graphic based on step
//   sticky.querySelector("p").innerText = el.dataset.step;
// }

// function init() {
//   // 2. setup the scroller passing options
//   // 		this will also initialize trigger observations
//   // 3. bind scrollama event handlers (this can be chained like below)
//   scroller
//     .setup({
//       step: "#scrolly article .step",
//       offset: 0.33,
//       debug: true
//     })
//     .onStepEnter(handleStepEnter);

//   // setup resize event
//   window.addEventListener("resize", scroller.resize);
// }

// // kick things off
// init();


Promise.all([
    d3.json('./assets/prodCompanies.json', d3.autoType),
    d3.json('./assets/movieData.json', d3.autoType),
    d3.json('./assets/debuts.json', d3.autoType),
    d3.csv('./assets/calendar.csv', d3.autoType),
    d3.json('./assets/genreData.json', d3.autoType),
]).then(function(files){

    prodCompanies = files[0];
    movieData = files[1];
    debutData = files[2];
    calendarData = files[3];
    genreData = files[4];

    genreData.pop();
    genreData.pop();

    console.log(genreData);

    loadProdDropdown();

    loadGenreDropdown();

    recheckDates();

    loadProductionMovies();
    
}).catch(function(err){
    console.log(err);
});

function loadProdDropdown() {
    let dropdown = document.getElementById("prodDropdown");

    var option = document.createElement("option");
        option.text = "All";
        dropdown.add(option);

    prodCompanies.forEach(function (company){
        var option = document.createElement("option");
        option.text = company.name;
        dropdown.add(option);
    });
}

function loadGenreDropdown(){
    let dropdown = document.getElementById("genreDropdown");

    var option = document.createElement("option");
        option.text = "All";
        option.value = -1;
        dropdown.add(option);

    genreData.forEach(function (genre){
        var option = document.createElement("option");
        option.value = +genre.id;
        option.text = genre.name;
        dropdown.add(option);
    });
}

function recheckDates() {

    for(let i = 0; i < movieData.length; i++){
        // let dt = movieData[i].release_date.split('-');
        movieData[i].release_date = new Date(movieData[i].release_date);    //get date in date format

        movieData[i].gross = +movieData[i].gross;
    }

    for(let i = 0; i < debutData.length; i++){
        debutData[i].debutMovie.release_date = new Date(debutData[i].debutMovie.release_date);    //get date in date format
    }

    for(let i = 0; i < calendarData.length; i++){
        let dt = calendarData[i]['Date'].split('-');
        calendarData[i]['Date'] = new Date(+dt[2], +dt[1]-1, +dt[0]);    //get date in date format
    }

    for(let i = 0; i < genreData.length; i++){
        for(let j = 0; j < genreData[i].movies.length; j++){
            // let dt = genreData[i].movies[j].['release_date'].split('-');
            genreData[i].movies[j].release_date = new Date(genreData[i].movies[j].release_date);    //get date in date format
        }
    }
}

function loadProductionMovies() {
    prodMovies.length = 0;
    
    let company = document.getElementById("prodDropdown").value;
  
    let tempData = movieData.slice();
    
    for(let i = 0; i < tempData.length; i++){
      let houses = tempData[i].production_companies;
  
      houses.forEach(function (house){
        if(house.name === company){
          prodMovies.push(tempData[i]);
        }
      });
    }

    // console.log("prodMovies");

    movieRangeChange();
    genreRangeChange();
}

function movieRangeChange() {
    let year = document.getElementById("year").value;
    document.getElementById("textYear").innerHTML = year;
    // document.getElementById("yearDebut").value = year;
    
    console.log(year);
    showMovies(year);
}

function genreRangeChange() {
    let year = document.getElementById("genreYear").value;
    
    console.log(year);
    loadGenreData(year);
}

function debutRangeChange() {
    let year = document.getElementById("yearDebut").value;
    // document.getElementById("year").value = year;
    
    console.log(year);
    // showMovies(year);
    showDebutants(year);
}

let xScale, yScale, rScale, genreScale, rDebutScale, movieCalendar, debutCalendar, genreLabels, fullCalendar, xxis, yxis, xAxis, yAxis;

function showMovies(year){

    console.log("called");

    genreToggle = false;

    let size = {width: 0.98 * document.getElementById("calendar").clientWidth, height: 500};

    xScale = d3.scaleLog()
                    .domain([new Date(year + "-01-01"), new Date(year + "-12-31")])
                    .range([80, 0.98 * size.width]);

    xAxis = d3.axisBottom(xScale)
                    .tickValues(d3.timeMonths(new Date((year-1) + "-12-31"), new Date(year + "-12-31"), 1))
                    .tickFormat(d3.timeFormat('%B'));
    
    yScale = d3.scaleLinear()
                    .domain(d3.extent(movieData, d => d.vote_average))
                    .range([450, 40]);

    yAxis = d3.axisLeft(yScale);

    genreScale = d3.scaleOrdinal()
                    .domain([28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37])
                    .range(["lightcoral", "lightsalmon", "palevioletred", "tomato", "darkorange", "darkkhaki", "thistle", "mediumpurple", "slateblue", "mediumspringgreen", "seagreen", "olive", "darkcyan", "cadetblue", "lightsteelblue", "cornflowerblue", "burlywood", "rebeccapurple", "lightgreen"]);

    rScale = d3.scalePow()
                    .domain(d3.extent(movieData, d => d.gross))
                    .range([4, 20]);

    rDebutScale = d3.scaleLog()
                    .domain(d3.extent(debutData, d => d.noOfMovies))
                    .range([4, 15]);

    d3.select("#calendar").selectAll("*").remove();

    fullCalendar = d3.select("#calendar")
                            .append("g")
                            .selectAll("rect")
                            .data(d3.filter(calendarData, d => d['Date'].getFullYear() == year))
                            .enter().append("rect")
                            .attr("x", d => xScale(d['Date']))
                            .attr("y", d => 40)
                            .attr("width", d => (eventsArray.includes(d.Name)) ? 3 : 1)
                            .attr("height", 410)
                            .attr("fill", d => (eventsArray.includes(d.Name)) ? "lightsalmon": "gainsboro")
                            .on("mouseover", (d, i) => console.log(i));

    let company = document.getElementById("prodDropdown").value;
    let selectedGenre = parseInt(document.getElementById("genreDropdown").value);

    console.log(selectedGenre);

    movieCalendar = d3.select("#calendar")
                    .attr("width", size.width)
                    .attr("height", size.height)
                    .append("g")
                    .selectAll("circle")
                    .data(d3.sort(d3.filter(movieData, d => d.release_date.getFullYear() == year), d => d.release_date))
                    .enter().append("circle")
                    .attr("cx", d => xScale(d.release_date))
                    .attr("cy", d => toggle ? 470 : yScale(d.vote_average))
                    .attr("r", 1)
                    .attr("fill", d => d.genre_ids[0] ? genreScale(d.genre_ids[0]) : "darkgray")
                    .attr("opacity", d => (company == "All" && selectedGenre == -1) ? 1 : (company == "All" && selectedGenre != -1) ? (d.genre_ids.includes(selectedGenre)) ? 1 : 0.2 : (company != "All" && selectedGenre == -1) ? (prodMovies.includes(d)) ? 1 : 0.4 : (prodMovies.includes(d) && d.genre_ids.includes(selectedGenre) ? 1 : 0.4))
                    .on("mouseover", (d, i) => console.log(i));

    movieCalendar.transition().ease(d3.easeCubicInOut).duration(1000)
                    .attr("r", d => toggle ? 1 : rScale(d.gross));

    let txScale = d3.scaleLinear()
                        .domain([0, genreData.length-1])
                        .range([160, 0.95 * size.width]);

    genreLabels = d3.select("#calendar").append("g")
                .selectAll("text")
                .data(d3.filter(genreData, d => d.name))
                .enter().append("text")
                .attr("x", (d, i) => txScale(i))
                .attr("y", 465)
                .text(d => d.name)
                .attr("text-anchor", "middle")
                .attr("font-size", "8px")
                .attr("opacity", 0);


    xxis = d3.select("#calendar")
                    .append("g")
                    .attr("transform", "translate(0, 470)")
                    .attr("opacity", 1)
                    .call(xAxis);

    yxis = d3.select("#calendar")
                    .append("g")
                    .attr("transform", "translate(40, 0)")
                    .attr("opacity", 1)
                    .call(yAxis);

    debutCalendar = d3.select("#calendar")
                            .attr("width", size.width)
                            .attr("height", size.height)
                            .append("g")
                            .selectAll("circle")
                            .data(d3.sort(d3.filter(debutData, d => d.debutMovie.release_date.getFullYear() == year), d => d.debutMovie.release_date))
                            .enter().append("circle")
                            .attr("cx", d => xScale(d.debutMovie.release_date))
                            .attr("cy", d => toggle ? yScale(d.highestVoteAverage) : 470)
                            .attr("r", d => toggle ? rDebutScale(d.noOfMovies) : 1)
                            .attr("fill", d => (d.noOfMovies > 10) ? "tomato" : "peachpuff")
                            .on("mouseover", (d, i) => console.log(i.name));
}

window.onload = (event) => {
    document.getElementById("testButton").addEventListener("click", testFunction);
    document.getElementById("testButton2").addEventListener("click", testFunction2);
};


function testFunction(){

    if(genreToggle){
        testFunction2();
    }
    
    console.log("clicked");
    if(!toggle){
        debutCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                .attr("cy", d => yScale(d.highestVoteAverage))
                .attr("r", d => rDebutScale(d.noOfMovies))
                .attr("opacity", 1);

        movieCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                    .attr("cy", 470)
                    .attr("r", 1);
            
    } else {
        debutCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                .attr("cy", 470)
                .attr("r", 1)
                .attr("opacity", 0);

        movieCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                    .attr("cy", d => yScale(d.vote_average))
                    .attr("r", d => rScale(d.gross));
    }

    toggle = !toggle;
}

let xxScale;

function testFunction2() {

    if(toggle){
        testFunction();
    }

    let size = {width: 0.95 * document.getElementById("calendar").clientWidth, height: 500};

    if(!genreToggle){
        xxScale = d3.scaleLinear()
                        .domain([0, genreData.length-1])
                        .range([160, 0.98 * size.width]);

        movieCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                        .attr("cx", d => xxScale(genreData.findIndex(p => p.id == d.genre_ids[0])))
                        .attr("cy", (d, i) => 450 - calculateHeight(i))
                        .attr("r", d => rScale(d.gross));

        genreLabels.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*100)
                        .attr("opacity", 1);

        fullCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*30)
                        .attr("height", 0);

        xxis.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                        .attr("opacity", 0)
                        .call(xAxis);

        debutCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                        .attr("opacity", 0);
    } else {
        movieCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                        .attr("cx", d => xScale(d.release_date))
                        .attr("cy", d => yScale(d.vote_average));

        genreLabels.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*100)
                        .attr("opacity", 0);

        fullCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*30)
                        .attr("height", 410);

        xxis.transition().ease(d3.easeCubicInOut).duration(3000).delay((d,i) => i*20)
                        .attr("opacity", 1)
                        .call(xAxis);

        debutCalendar.transition().ease(d3.easeCubicInOut).duration(1000).delay((d,i) => i*20)
                        .attr("opacity", 1);
    }

    genreToggle = !genreToggle;
}

function calculateHeight(ind) {
    let temp = 0.0;
    let year = document.getElementById("year").value;
    let dataTemp = d3.sort(d3.filter(movieData, d => d.release_date.getFullYear() == year), d => d.release_date);
    let movieGenre = dataTemp[ind].genre_ids[0];

    for(let i = 0; i <= ind; i++){
        if(dataTemp[i].genre_ids[0] == movieGenre){
            let mul = (i == ind) ? 1 : 2;
            temp += rScale(dataTemp[i].gross) * mul;
        }
    }

    return temp;
}

let xgScale, ygScale, genreChart;

function loadGenreData(year){
    console.log("GenreData" + year);

    let size = {width: 1 * document.getElementById("genres").clientWidth, height: 500};

    xgScale = d3.scaleLinear()
                    .domain([0, genreData.length-1])
                    .range([80, 0.925 * size.width]);

    const xgAxis = d3.axisBottom(xgScale);
    
    ygScale = d3.scaleLinear()
                    .domain([0, d3.max(filterGenreData(year), d => d.movies.length)])
                    .range([450, 40]);

    const ygAxis = d3.axisLeft(ygScale);

    d3.select("#genres").selectAll("*").remove();

    genreChart = d3.select("#genres")
                    .attr("width", size.width)
                    .attr("height", size.height)
                    .append("g");
    
    genreChart
    .selectAll("rect")
    .data(filterGenreData(year))
    .enter().append("rect")
    .attr("x", (d, i) => xgScale(i))
    .attr("y", (d, i) => ygScale(d.movies.length))
    .attr("width", 20)
    .attr("height", (d, i) => 450 - ygScale(d.movies.length))
    .on("mouseover", (d, i) => console.log(i));

    genreChart
    .selectAll("text")
    .data(d3.filter(genreData, d => d.name))
    .enter().append("text")
    .attr("x", (d, i) => xgScale(i) + (20/2))
    .attr("y", 470)
    .text(d => d.name)
    .attr("text-anchor", "middle")
    .attr("font-size", "8px")
    .on("mouseover", (d, i) => console.log(i));

    // let xxis = d3.select("#genres")
    //                 .append("g")
    //                 .attr("transform", "translate(0, 480)")
    //                 .call(xAxis);

    let yxis = d3.select("#genres")
                    .append("g")
                    .attr("transform", "translate(40, 0)")
                    .call(ygAxis);

}

function filterGenreData(xYear){
    let temp = genreData.slice();
    let results = [];

    temp.forEach(function (genCategory){
        let movieArray = [];

        genCategory.movies.forEach(function (movie){
            if(movie.release_date.getFullYear() == xYear)
                movieArray.push(movie);
        });

        results.push({id: genCategory.id, name: genCategory.name, movies: movieArray});

    });

    return results;
}