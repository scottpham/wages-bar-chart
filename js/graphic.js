var mobileThreshold = 500, //set to 500 for testing
    aspect_width = 16,
    aspect_height = 11,
    tickNumber = 10;

//standard margins
var margin = {
    top: 30,
    right: 70,
    bottom: 20,
    left: 185
};
//jquery shorthand
var $graphic = $('#graphic');
//base colors
var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
$(window).load(function() {
    draw_graphic();
});

function draw_graphic(){
    if (Modernizr.svg){
        $graphic.empty();
        var width = $graphic.width();
        render(width);
        window.onresize = draw_graphic; //very important! the key to responsiveness
    }

}

function render(width) {

    function checkWidth(width){
        if (width<475){
            $("#btn-group").attr("class", "btn-group-vertical");
        }
    }
    
    checkWidth(width);

    //empty object for storing mobile dependent variables
    var mobile = {};
    //check for mobile
    function ifMobile (w) {
        if(w < mobileThreshold){
            console.log("mobileThreshold reached");
            margin.left = 145;
            mobile.gap = .5;
            height = height * 1.5;
            // margin.right 
        }
        else{
            margin.left = 175;
            mobile.gap = 0.25;
        }
    } 
    //call mobile check
    ifMobile(width);
    //calculate height against container width
    var height = Math.ceil((width * aspect_height) / aspect_width) - margin.top - margin.bottom;

    console.log("height = " + height);

    height < 250 ? height = 250: null;

    var x = d3.scale.linear().range([0, width - margin.left - margin.right]),
        //second param is a gap
        y = d3.scale.ordinal().rangeRoundBands([0, height], mobile.gap);

    var format = d3.format("0.2f"); //formats to two decimal places

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat("")//"" means blank
        .orient("top");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    //create main svg container
    var svg = d3.select("#graphic").append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //tooltip
    var div = d3.select("#graphic").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //coercion function called back during csv call
    function type(d){
        return {
            complaints: +d.complaints,
            awards: +d.awards,
            company: d.company
        }
    }

    var awardFormat = d3.format("$,.0f")

    //asynchronous csv call
    d3.csv("awards.csv", type, function(error, data) {
        //x domain is between 0 and max of the selected
        x.domain([0, d3.max(data, function(d){ return d.awards; })]);
        //y domain sorts counties based on selected value
        y.domain(data.sort( function (a, b) { return b.awards - a.awards; }).map(function(d) { return d.company}));

        //bars
        svg.selectAll(".bar")
              .data(data)
            .enter().append("rect")
                .attr("class", "bar bar-awards")
                .attr("x", 0)
                .attr("width", function(d){ return x(d.awards); })
                .attr("y", function(d){ return y(d.company); })
                .attr("height", y.rangeBand());

        //value labels
        svg.selectAll(".label")
            .data(data)
            .enter().append("text")
                .attr("class", "label label-awards")
                .text(function(d) { return awardFormat(d.awards); })
                .attr("y", function(d){ return y(d.company) + (y.rangeBand()/2); })
                .attr("x", function(d){ return x(d.awards) + 3; })
                .attr("dy", 3);

        //append g for county names
        svg.append("g")
            .attr("transform", "translate(-10,0)")
            .attr("class", "y axis")
            .call(yAxis)
                .attr("text-anchor", "end")
            .selectAll(".tick text")
                .call(wrap, margin.left);

        // svg.selectAll(".tick").style("font-size", mobile.fontSize)
    
    //end of csv call function
    });


    ///////////events////////////

    d3.select("#award").on("click", function(){ 

        //callback to de-string my numbers
        function type(d){
            d.awards = +d.awards;
            return d;
        }

        d3.csv("awards.csv", type, function(error, data){

            var delay = function(d, i){ return i * 100; };

            //reset domain
            x.domain([0, d3.max(data, function(d){ return d.awards; })]);
            y.domain(data.sort( function (a, b) { return b.awards - a.awards; }).map(function(d) { return d.company}));

            //resort the counties
            var ySort = y.domain(data.sort( function(a, b){ return b.awards - a.awards; })
                .map(function(d){ return d.company; }));

            var svg = d3.select("#graphic");

            //dim ticks

            svg.selectAll(".tick")
                .transition()
                .style("opacity",0)
                .each("end",resetBarWidth);

            //reset bar width

            function resetBarWidth(){
                svg.selectAll(".bar")
                    .transition(400)
                    .attr("width", 0)
                    .each("end",buildAwards);
            }

            function buildAwards(){    

                svg.selectAll(".bar")
                      .data(data)
                      .transition()
                        .attr("class", "bar bar-awards")
                        .attr("x", 0)
                        .attr("width", function(d){ return x(d.awards); })
                        .attr("y", function(d){ return y(d.company); })
                        .attr("height", y.rangeBand());

                //value labels
                svg.selectAll(".label")
                    .data(data)
                        .transition()
                        .attr("class", "label label-awards")
                        .text(function(d) { return awardFormat(d.awards); })
                        .attr("y", function(d){ return y(d.company) + (y.rangeBand()/2); })
                        .attr("x", function(d){ return x(d.awards) + 3; })
                        .attr("dy", 3);

                //re add company names
                svg.select(".y.axis")
                    .call(yAxis)
                    .transition()
                    .attr("text-anchor", "end")
                    .selectAll(".tick text")
                    .call(wrap, margin.left);
            }
        });//end of d3.csv

    });//end button



// complaints reset

d3.select("#complaints").on("click", function(){ 

        //callback to de-string my numbers
        function type(d){
            d.complaints = +d.complaints;
            return d;
        }

        d3.csv("complaints.csv", type, function(error, data){


            var delay = function(d, i){ return i * 100; };

            //reset domain
            x.domain([0, d3.max(data, function(d){ return d.complaints; })]);
            y.domain(data.sort( function (a, b) { return b.complaints - a.complaints; }).map(function(d) { return d.company}));

            //resort the counties
            var ySort = y.domain(data.sort( function(a, b){ return b.complaints - a.complaints; })
                .map(function(d){ return d.company; }));

            var svg = d3.select("#graphic");

            //dim ticks
            svg.selectAll(".tick")
                .transition()
                .style("opacity",0)
                .each("end",resetBarWidth);

            //reset bar width
            function resetBarWidth(){
                svg.selectAll(".bar")
                    .transition(400)
                    .attr("width", 0)
                    .each("end",buildComplaints);
            }

            //build out rest of chart
            function buildComplaints(){    

                //bar widths
                svg.selectAll(".bar")
                      .data(data)
                      .transition()
                        .attr("class", "bar bar-complaints")
                        .attr("x", 0)
                        .attr("width", function(d){ return x(d.complaints); })
                        .attr("y", function(d){ return y(d.company); })
                        .attr("height", y.rangeBand());

                //value labels
                svg.selectAll(".label")
                    .data(data)
                        .transition()
                        .attr("class", "label label-complaints")
                        .text(function(d) { return d.complaints })
                        .attr("y", function(d){ return y(d.company) + (y.rangeBand()/2); })
                        .attr("x", function(d){ return x(d.complaints) + 3; })
                        .attr("dy", 3);

                //re add company names
                svg.select(".y.axis")
                    .call(yAxis)
                    .transition()
                    .attr("text-anchor", "end")
                    .selectAll(".tick text")
                    .call(wrap, margin.left);

            }


        });//end of d3.csv

    });//end button








    //outer scope begin
    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.3, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);}
            }
        });
    }//end wrap()



}//end function render    





