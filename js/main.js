let selection = "date";
let selectedCase = {"id": "-", "age": "-", "gender": "-", "nationality": "-", "occupation": "-", "organization": "-", "date": "-", "vaccinated": "-"};
let dateFormat = d3.timeParse("%d/%m/%Y");
let dateScale = d3.scaleLinear()
  .domain([dateFormat("28/04/2021"), dateFormat("12/05/2021"), dateFormat("26/05/2021")])
  .range(["#aaa", "#aaa", "#f00"]);

let ageScale = d3.scaleQuantize([0, 90], d3.schemeSpectral[9]);
let genderScale = d3.scaleOrdinal(["male", "female"], ["steelblue", "pink"]);
let vaccineScale = d3.scaleOrdinal(["-", "partial (1 dose)", "yes (2 doses)"], ["gray", "yellow", "green"]);
let asymptomaticScale = d3.scaleOrdinal(["-", "yes"], ["gray", "blueviolet"]);

Promise.all([d3.json("data/links.json"), d3.json("data/cases.json"), d3.json("data/MOHlinks.json")]).then(data => {

    data[0].forEach(e => {
        e.source = e.infector;
        e.target = e.infectee;
    });
    
    //console.log(data[0]);
    //console.log(data[1]);
    //console.log(data[2]);
    //console.log(data[1].filter(d => d.variant != null));

d3.select("#casecount").text(d3.timeFormat("%d %b %Y, %a")(dateFormat(data[2][0].date)) + " (" + (data[1].length - data[1].filter(d => d.bigcluster == true).length) + " cases)");

let width = 1800,
    height = 1800;

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
    
let chart = svg.append("g").attr("id", "chart");
    
let linkpath = chart.append("g").attr("id", "links")
    .selectAll("path")
    .data(data[0])
  .enter().append("path")
    .attr("class", "link");

let nodes = chart.append("g").attr("id", "nodes")
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
        } else if (selection == "vaccine") {
            return vaccineScale(d.vaccinated);
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
        d3.select("#case_" + selectedCase.id)
        .classed("clicked", false);
        
        if (d.id == selectedCase.id) {
            selectedCase = {"id": "-", "age": "-", "gender": "-", "nationality": "-", "occupation": "-", "organization": "-", "date": "-", "vaccinated": "-"};
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
            
            d3.select(event.currentTarget)
            .classed("clicked", true);
        }
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
            chart.attr("transform", event.transform );
            d3.select("svg").attr("cursor", "grabbing");
        })
        .on("end", () => { 
            d3.select("svg").attr("cursor", "default");
        })
);

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
    d3.select("#legend").attr("src", "img/legend_date.png");
    updateSelection("date");
});
d3.select("#ageSelect").on("click", (event,d)=> {
    d3.select("#legend").attr("src", "img/legend_age.png");
    updateSelection("age");
});
d3.select("#genderSelect").on("click", (event,d)=> {
    d3.select("#legend").attr("src", "img/legend_gender.png");
    updateSelection("gender");
});
d3.select("#vaccineSelect").on("click", (event,d)=> {
    d3.select("#legend").attr("src", "img/legend_vaccinated.png");
    updateSelection("vaccine");
});
d3.select("#asymptomaticSelect").on("click", (event,d)=> {
    d3.select("#legend").attr("src", "img/legend_asymptomatic.png");
    updateSelection("asymptomatic");
});

d3.select("#searchSubmit").on("click", (event,d)=> {
    let caseId = d3.select("#searchField").node().value;
    let caseResult = data[1].find(d => d.id == caseId);
    if (caseResult != null) {
        d3.select("#case_" + selectedCase.id)
        .classed("clicked", false);
        
        d3.select("#case").text(caseResult.id);
        d3.select("#age").text(caseResult.age);
        d3.select("#gender").text(caseResult.gender);
        d3.select("#occupation").text(caseResult.occupation);
        d3.select("#organization").text(caseResult.organization);
        d3.select("#date_recorded").text( () => {
            if (caseResult.date == "-") return "-";
            else return d3.timeFormat("%d %b %Y, %a")(dateFormat(caseResult.date));
        });
        d3.select("#vaccinated").text(caseResult.vaccinated);
        
        d3.select("#case_" + caseId)
        .classed("clicked", true);
        
        selectedCase = caseResult;
    } else {
        alert("Case " + caseId + " not found");
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
        } else if (selection == "vaccine") {
            return vaccineScale(d.vaccinated);
        } else if (selection == "asymptomatic") {
            return asymptomaticScale(d.asymptomatic);
        }
    });
}


}); //end Promise
