let selection = "date";
let selectedCase = {"id": "-", "age": "-", "gender": "-", "nationality": "-", "occupation": "-", "organization": "-", "date": "-", "vaccinated": "-"};
let caseResult = [];
let searchString = "";
let dateFormat = d3.timeParse("%d/%m/%Y");
let currentDate = "18/06/2021";
let startDate = "28/04/2021";
let dateScale = d3.scaleSequential(d3.interpolateSpectral)
  .domain([dateFormat(currentDate), dateFormat(startDate)]);

let ageScale = d3.scaleQuantize([0, 90], d3.schemeRdBu[9]);
let genderScale = d3.scaleOrdinal(["male", "female"], ["steelblue", "pink"]);
let vaccinatedScale = d3.scaleOrdinal(["-", "partial (1 dose)", "yes (2 doses)"], ["#aaa", "yellow", "green"]);
let asymptomaticScale = d3.scaleOrdinal(["-", "yes"], ["#aaa", "blueviolet"]);

Promise.all([d3.json("data/links-alltime.json"), d3.json("data/cases-alltime.json"), d3.json("data/MOHlinks.json")]).then(data => {

    data[0].forEach(e => {
        e.source = e.infector;
        e.target = e.infectee;
    });
    
caseResult = data[1];

d3.select("#lastdate").text(d3.timeFormat("%d %b %Y")(dateFormat(data[2][0].date)));
d3.select("#casecount").text(data[1].length - data[1].filter(d => d.bigcluster == true).length + " cases");

let width = 2400,
    height = 2200;

let force = d3.forceSimulation(data[1])
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .force("link", d3.forceLink(data[0])
        .id(function(d) {return d.id; })
    )
    .on("tick", tick);

let svg = d3.select("#graph").append("svg")
    .attr("viewBox", "0 0 " + width + " " + height);

svg.append("rect")
    .attr("class", "rectBackground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);
    
let graph = svg.append("g").attr("id", "graph");
    
let linkpath = graph.append("g").attr("id", "links")
    .selectAll("path")
    .data(data[0])
  .enter().append("path")
    .attr("class", "link");

let nodes = graph.append("g").attr("id", "nodes")
    .selectAll("g")
    .data(data[1])
  .enter()
    .append("g");
    
let circle = nodes.append("circle")
    .attr("class", "node")
    .attr("id", d => "case_" + d.id)
    .attr("r", d => { if (d.bigcluster == true) return 20; else return 15})
    .attr("fill", d => { 
        if (d.bigcluster == true) return "black";
        else if (selection == "date") {
            return dateScale(dateFormat(d.date));
        } else if (selection == "age") {
            return ageScale(d.age);
        } else if (selection == "gender") {
            return genderScale(d.gender);
        } else if (selection == "vaccinated") {
            return vaccinatedScale(d.vaccinated);
        } else if (selection == "asymptomatic") {
            return asymptomaticScale(d.asymptomatic);
        }
    })
    .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("selected", true);
        d3.select("#caseInfoText").text("Case info (mouseover)");
        
        linkpath
        .attr("class", e => { 
            if (e.source.id == d.id || e.target.id == d.id) { return "link selected"; } else { return "link"; }
        });
        
        d3.select("#case").text(d.id);
        d3.select("#age").text(d.age);
        d3.select("#gender").text(d.gender);
        d3.select("#occupation").text(d.occupation);
        d3.select("#organization").text(d.organization);
        d3.select("#date_recorded").text( () => {
            if (d.date == "-") return "-";
            else return d3.timeFormat("%d %b %Y, %a")(dateFormat(d.date));
        });
        d3.select("#vaccinated").text(d.vaccinated);
        d3.select("#asymptomatic").text(() => {
            if (d.asymptomatic != undefined) return d.asymptomatic; else return "-";
        });
    })
    .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).classed("selected", false);
        d3.select("#caseInfoText").html("Case info (<span style='color:#00f'>selected</span>)");

        linkpath
        .attr("class", "link");
        
        d3.select("#case").text(selectedCase.id);
        d3.select("#age").text(selectedCase.age);
        d3.select("#gender").text(selectedCase.gender);
        d3.select("#occupation").text(selectedCase.occupation);
        d3.select("#organization").text(selectedCase.organization);
        d3.select("#date_recorded").html( () => {
            if (selectedCase.date == "-") return "-";
            else {
                let MOHdate = data[2].find(e => e.date == selectedCase.date);
                return "<a href='" + MOHdate.link + "' target='_blank'>" + d3.timeFormat("%d %b %Y, %a")(dateFormat(selectedCase.date)) + "</a>";
            }
        });
        d3.select("#vaccinated").text(selectedCase.vaccinated);
        d3.select("#asymptomatic").text(() => {
            if (selectedCase.asymptomatic != undefined) return selectedCase.asymptomatic; else return "-";
        });
    })
    .on("click", (event,d) => {
        d3.selectAll(".node")
        .classed("clicked", false);

        if (d.id == selectedCase.id) {
            selectedCase = {"id": "-", "age": "-", "gender": "-", "nationality": "-", "occupation": "-", "organization": "-", "date": "-", "vaccinated": "-"};
            caseResult = data[1];
            searchString = "";
            d3.select("#searchField").node().value = "";

        } else {
            selectedCase = d;
            
            d3.select("#caseInfoText").html("Case info (<span style='color:#00f'>selected</span>)");
            d3.select("#date_recorded").html( () => {
                if (selectedCase.date == "-") return "-";
                else {
                    let MOHdate = data[2].find(e => e.date == selectedCase.date);
                    return "<a href='" + MOHdate.link + "' target='_blank'>" + d3.timeFormat("%d %b %Y, %a")(dateFormat(selectedCase.date)) + "</a>";
                }
            });

            caseResult = [selectedCase];
            searchString = selectedCase.id;
            d3.select("#searchField").node().value = selectedCase.id;

            d3.select(event.currentTarget)
            .classed("clicked", true);
        }

        drawChart(selection, caseResult);
    })
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
        
let image = nodes.append("image")
    .attr("xlink:href",  d => {
        if (d.bigcluster == true) {
            return d.icon;
        } else 
        if (d.gender == "male") return "img/male.svg"; else return "img/female.svg"
    })
    .attr("width", 15)
    .attr("height", 15)
    .attr("pointer-events", "none");
    
svg.call(
    d3.zoom()
        .scaleExtent([.5, 4])
        .on("zoom", event => { 
            graph.attr("transform", event.transform );
            d3.select("svg").attr("cursor", "grabbing");
        })
        .on("end", () => { 
            d3.select("svg").attr("cursor", "default");
        })
);

drawChart(selection, data[1]);

// Use elliptical arc path segments to doubly-encode directionality.
function tick() {
  linkpath.attr("d", d => {
      let dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0 1 " + d.target.x + "," + d.target.y;
  });

  circle
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  image
    .attr("x", d => d.x - 7.5)
    .attr("y", d => d.y - 7.5);
}

function dragstarted(event, d) {
  if (!event.active) force.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) force.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Update interface
d3.select("#dateSelect").on("click", (event,d)=> {
    updateSelection("date");
    drawChart("date", caseResult);
});
d3.select("#ageSelect").on("click", (event,d)=> {
    updateSelection("age");
    drawChart("age", caseResult);
});
d3.select("#genderSelect").on("click", (event,d)=> {
    updateSelection("gender");
    drawChart("gender", caseResult);
});
d3.select("#vaccineSelect").on("click", (event,d)=> {
    updateSelection("vaccinated");
    drawChart("vaccinated", caseResult);
});
d3.select("#asymptomaticSelect").on("click", (event,d)=> {
    updateSelection("asymptomatic");
    drawChart("asymptomatic", caseResult);
});

d3.select("input[type=search]").on("search", (event, d)=> {
    caseResult = data[1];
    searchString = "";

    d3.selectAll(".node")
    .classed("clicked", false);

    drawChart(selection, caseResult);
});

d3.select("#searchSubmit").on("click", (event,d)=> {
    searchString = d3.select("#searchField").node().value;

    if (searchString != "") {
        let regex = new RegExp(searchString.toLowerCase());

        caseResult = data[1].filter(d => d.bigcluster != true && regex.test(d.id) || regex.test(d.occupation.toLowerCase()) || regex.test(d.organization.toLowerCase()));
        
        if (caseResult.length > 0) {
            
            d3.selectAll(".node")
            .classed("clicked", false);
            
            caseResult.forEach(e => {
                d3.select("#case_" + e.id)
                    .classed("clicked", true);
            })

            drawChart(selection, caseResult);

            if (caseResult.length == 1) {
                d3.select("#case").text(caseResult[0].id);
                d3.select("#age").text(caseResult[0].age);
                d3.select("#gender").text(caseResult[0].gender);
                d3.select("#occupation").text(caseResult[0].occupation);
                d3.select("#organization").text(caseResult[0].organization);
                d3.select("#date_recorded").text( () => {
                    if (caseResult.date == "-") return "-";
                    else return d3.timeFormat("%d %b %Y, %a")(dateFormat(caseResult[0].date));
                });
                d3.select("#vaccinated").text(caseResult[0].vaccinated);

                selectedCase = caseResult[0];
            } else {
                selectedCase = {"id": "-", "age": "-", "gender": "-", "nationality": "-", "occupation": "-", "organization": "-", "date": "-", "vaccinated": "-"};
            }
            
        } else {
            alert("String: " + searchString + " not found");
            caseResult = data[1];
        }
    }
});

function updateSelection(category) {
  selection = category;

  circle
    .attr("fill", d => { 
        if (d.bigcluster == true) return "black";
        else if (selection == "date") {
            return dateScale(dateFormat(d.date));
        } else if (selection == "age") {
            return ageScale(d.age);
        } else if (selection == "gender") {
            return genderScale(d.gender);
        } else if (selection == "vaccinated") {
            return vaccinatedScale(d.vaccinated);
        } else if (selection == "asymptomatic") {
            return asymptomaticScale(d.asymptomatic);
        }
    });
}

/* Histogram summary chart */
function drawChart(category, data) {
    selection = category;
    d3.select("svg#summarychart g").remove();

    let chart = {
            width: 400,
            height: 180,
            margin: { left: 40, top: 30, right:20, bottom: 40 }
        };

    let summaryChart = d3.select("svg#summarychart")
        .attr("viewBox", "0 0 " + chart.width + " " + chart.height)
        .append("g")
        .attr("transform", "translate(" + chart.margin.left + ", " + chart.margin.top + " )");

    // Remove all the extra big cluster nodes needed for graph visualization
    let summaryData = data.filter(d => d.bigcluster != true);
    
        if (selection == "date") {
            //summaryData = summaryData.filter(d => dateFormat(d.date) >= d3.timeDay.offset(dateFormat(currentDate), -28));
            summaryData = _.entries(_.countBy(summaryData, d => d.date));
        } else if (selection == "age") {
            summaryData = _.entries(_.countBy(summaryData, d => Math.floor(d.age / 10))).map(d => [d[0] *10, d[1]]);
        } else if (selection == "gender") {
            summaryData = _.entries(_.countBy(summaryData, d => d.gender));
        } else if (selection == "vaccinated") {
            summaryData = _.entries(_.countBy(summaryData, d => d.vaccinated));
        } else if (selection == "asymptomatic") {
            summaryData = _.entries(_.countBy(summaryData, d => d.asymptomatic))
                            .map(d => {if (d[0] == "undefined") return ["-", d[1]]; else return [d[0], d[1]]});
        }
        
    //console.log(summaryData);

    let xScale = null;
        if (selection == "date") {
            xScale = d3.scaleTime()
                .domain([dateFormat(startDate), dateFormat(currentDate)])
                .range([0, chart.width - chart.margin.left - chart.margin.right]);
        } else if (selection == "age") {
            xScale = d3.scaleLinear()
                .domain([0, 100])
                .range([0, chart.width - chart.margin.left - chart.margin.right]);
        } else if (selection == "gender") {
            xScale = d3.scaleBand()
                .domain(["male", "female"])
                .rangeRound([0, chart.width - chart.margin.left - chart.margin.right])
                .padding(0.1);
        } else if (selection == "vaccinated") {
            xScale = d3.scaleBand()
                .domain(["-", "partial (1 dose)", "yes (2 doses)"])
                .rangeRound([0, chart.width - chart.margin.left - chart.margin.right])
                .padding(0.1);
        } else if (selection == "asymptomatic") {
            xScale = d3.scaleBand()
                .domain(["-", "yes"])
                .rangeRound([0, chart.width - chart.margin.left - chart.margin.right])
                .padding(0.1);
        }

    let yScale = d3.scaleLinear()
        .domain([0, d3.max(summaryData.map(d => d[1]))])
        .range([chart.height - chart.margin.top - chart.margin.bottom, 0]);

    if (selection == "date") {
        summaryChart
            .append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0, " + (chart.height - chart.margin.bottom - chart.margin.top) + ")")
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%d/%m")));
    } else if (selection == "age" || selection == "gender" || selection == "vaccinated" || selection == "asymptomatic") {
        summaryChart
            .append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0, " + (chart.height - chart.margin.bottom - chart.margin.top) + ")")
            .call(d3.axisBottom(xScale));
    }

    summaryChart
        .append("g")
        .attr("class", "axis axis-y")
        .call(d3.axisLeft(yScale).ticks(5));
        

    let chartSearchText = (searchString == "") ? "all cases" : "search: " + searchString;

    summaryChart
        .append("text")
        .attr("transform", "translate(" + ((chart.width - chart.margin.right - chart.margin.left)/2) + " , -10)")
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(selection.charAt(0).toUpperCase() + selection.slice(1) + " (" +  chartSearchText + ")");

    if (selection == "date") {
        summaryChart.selectAll("rect")
            .data(summaryData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(dateFormat(d[0])) + 1)
            .attr("width", 5)
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(0) - yScale(d[1]))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("fill", d => dateScale(dateFormat(d[0])));
    }else if (selection == "age") {
        summaryChart.selectAll("rect")
            .data(summaryData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d[0]) + 1)
            .attr("width", 30)
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(0) - yScale(d[1]))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("fill", d => ageScale(d[0]));
    } else if (selection == "gender" || selection == "vaccinated"|| selection == "asymptomatic") {
        summaryChart.selectAll("rect")
            .data(summaryData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d[0]))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(0) - yScale(d[1]))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("fill", d => { 
                if (selection == "gender") {
                    return genderScale(d[0]);
                } else if (selection == "vaccinated") {
                    return vaccinatedScale(d[0]);
                } else if (selection == "asymptomatic") {
                    return asymptomaticScale(d[0]);
                }
            });
    }
}

}); //end Promise
