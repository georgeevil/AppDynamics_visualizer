// Generate random colors to make graph pretty
var randomColorFactor = function() {
    return Math.round(Math.random() * 255);
};
var randomColor = function(opacity) {
    return 'rgba(' + randomColorFactor() + ',' + randomColorFactor() + ',' + randomColorFactor() + ',' + (opacity || '.3') + ')';
};

$.ajaxSetup({
    xhrFields: {
        withCredentials: true
    }
});

// Update chart data ajax after modal form submission
$("#visualizeButton").click(function(event){
    event.preventDefault();
    
    $.ajax({
        type: "POST",
        url: 'http://localhost:8080/charty/fetchMetricChart',
        data: $("form").serialize(), // serializes the form's elements.
        success: function(dataJSON)
        {
            // Parse response
    		var updatedChartData = JSON.parse(dataJSON);
            var chartPlotData = new Array();

            // Catch errors
            if (updatedChartData.error){
                alert(updatedChartData.error);
                return;
            }

            updatedChartData.chartData.forEach(function(entry, index){
                chartPlotData.push(entry.value);
            });

            var primaryColor = randomColor(0.7);

    		// Update dataset
  			var newDataset = {
                label: updatedChartData.title + ": " + updatedChartData.startTime + " to " + updatedChartData.endTime,
                borderColor: primaryColor,
                backgroundColor: primaryColor,
                pointBorderColor: primaryColor,
                pointBackgroundColor: primaryColor,
                pointBorderWidth: 1,
                data: chartPlotData
            };
            config.data.datasets.push(newDataset);

            addMetricToList(primaryColor, updatedChartData.title);

            // Update y axis max-value if data-set's max value exceeds current max value
            var maxYValue = updatedChartData.maxValue;
            config.options.scales.yAxes[0].ticks.suggestedMax = (config.options.scales.yAxes[0].ticks.suggestedMax > maxYValue) ? config.options.scales.yAxes[0].ticks.suggestedMax : maxYValue;
            
            // Update the graph
            window.myLine.update();
            $('#updateData').modal('hide');


	   }
    });
});

// Initial config for graph
var config = {
    type: 'line',
    data: {
        // x-axis labels are increments of 5 percent
        labels: ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
        datasets: []
    },
    options: {
        // Mobile responsive true for now
        responsive: true,
        title:{
            // Chart main title
            display:true,
            text:'AppDynamics Line Chart Visualizer'
        },
        tooltips: {
            // Hover over a point, pop up
            mode: 'label',
            callbacks: {
            }
        },
        hover: {
            mode: 'dataset'
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Percentage of time elapsed of time interval'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Traffic'
                },
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 250, // Change this depending on max value of called 
                }
            }]
        }
    }
};

// Initializer
window.onload = function() {
    // Update colors for each dataset 
    $.each(config.data.datasets, function(i, dataset) {
        dataset.borderColor = randomColor(0.4);
        dataset.backgroundColor = randomColor(0.5);
        dataset.pointBorderColor = randomColor(0.7);
        dataset.pointBackgroundColor = randomColor(0.5);
        dataset.pointBorderWidth = 1;
    });
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = new Chart(ctx, config);
};

// Add metric to list
function addMetricToList(color, name) {
    var ul = document.getElementById("metricsList");
    var li = document.createElement("li");
    li.setAttribute("id", "metric"+(ul.children.length-1));
    li.setAttribute("class", "list-group-item");
    li.style.borderColor =  color;
    li.appendChild(document.createTextNode(name));
    var deleteButton = $("<button />").addClass("deleteButton btn btn-danger").text("x");
    $(deleteButton).attr("style", "text-align:right;  margin-right:10px; padding-left:3px; padding-top:0px; padding-bottom:2px; padding-right:3px; font-size:8px; margin-top:-3px;");
    $(deleteButton).attr("onclick", "deleteMetric(this)");
    deleteButton.prependTo(li);
    ul.appendChild(li);
}

// Delete the metric
function deleteMetric(deleteButton){
    deleteButton.parentNode.parentNode.removeChild(deleteButton.parentNode);
    config.data.datasets.splice(deleteButton.parentNode.getAttribute("id").replace("metric",""),1);
    window.myLine.update();
}

// Remove last added data set
$('#removeDataset').click(function() {
    config.data.datasets.splice(0, 1);
    
});